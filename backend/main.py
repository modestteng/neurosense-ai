"""NeuroSense AI backend boundary.

Keep API keys and raw biometric data server-side. The browser only receives
interpretable state summaries, policy decisions, and rendered response plans.
"""

import os
from typing import Any, Literal

import httpx
from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="NeuroSense AI API", version="0.1.0")


class StateRequest(BaseModel):
    scene: str = "学习"
    human_state: dict[str, Any] = Field(default_factory=dict)


class ChatRequest(StateRequest):
    message: str
    history: list[dict[str, str]] = Field(default_factory=list)
    policy: dict[str, Any] = Field(default_factory=dict)
    knowledge_context: str = ""


def choose_policy(scene: str, state: dict[str, Any]) -> dict[str, Any]:
    """Deterministic safety/policy layer; LLM generation comes after this step."""
    fatigue = float(state.get("fatigue", 0))
    confusion = float(state.get("confusion", 0))
    if scene in {"驾驶", "工业安全"}:
        return {"strategy": "safety_first", "responseLength": "Very short", "voice": True, "safetyPriority": "Critical"}
    if fatigue > 0.7:
        return {"strategy": "protect_attention", "responseLength": "Very short", "visualMode": "Key card", "restRecommendation": True}
    if confusion > 0.6:
        return {"strategy": "reduce_cognitive_load", "responseLength": "Short", "difficulty": "Easy", "formulaDensity": "None", "visualMode": "Diagram + animation", "tone": "Supportive"}
    return {"strategy": "maintain_exploration", "responseLength": "Standard", "difficulty": "Medium", "tone": "Clear"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "NeuroSense AI"}


@app.post("/api/vision/scene")
async def vision_scene() -> dict[str, Any]:
    return {"scene": "办公", "confidence": 0.93, "source": "mock"}


@app.post("/api/vision/state")
async def vision_state() -> dict[str, Any]:
    return {"attention": 0.49, "fatigue": 0.34, "facialAffect": "frown", "gaze": "away", "source": "mock"}


@app.get("/api/eeg/state")
async def eeg_state() -> dict[str, Any]:
    return {"emotion": "Negative", "confidence": 0.91, "trend": "rising", "embeddingDimension": 48, "model": "TCG-3DNet", "source": "mock"}


@app.get("/api/eeg/embedding")
async def eeg_embedding() -> dict[str, Any]:
    return {"dimension": 48, "embedding": [0.0] * 48, "source": "mock"}


@app.get("/api/eeg/graph")
async def eeg_graph() -> dict[str, Any]:
    return {"model": "Trajectory-Conditioned Graph 3D Network", "window": "t3", "edges": [], "source": "mock"}


@app.post("/api/fusion/state")
async def fusion_state(request: StateRequest) -> dict[str, Any]:
    return {"scene": request.scene, "humanState": request.human_state, "confidence": 0.92}


@app.post("/api/policy/decision")
async def policy_decision(request: StateRequest) -> dict[str, Any]:
    return choose_policy(request.scene, request.human_state)


@app.post("/api/session/state")
async def session_state(request: StateRequest) -> dict[str, Any]:
    return {"retention": "session_only", "activeScene": request.scene, "state": request.human_state}


@app.post("/api/simulation/scenario")
async def simulation_scenario(scenario: Literal["normal", "confused", "frustrated", "fatigued", "recovered"]) -> dict[str, str]:
    return {"scenario": scenario, "mode": "mock"}


@app.post("/api/chat")
async def chat(request: ChatRequest) -> dict[str, Any]:
    """Calls DeepSeek only from this backend when DEEPSEEK_API_KEY is configured."""
    policy = request.policy or choose_policy(request.scene, request.human_state)
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        return {"mode": "mock", "policy": policy, "content": "DeepSeek is not configured. Connect DEEPSEEK_API_KEY on the server to enable generation."}
    system = f"""You generate adaptive responses. Scene: {request.scene}
Human state: {request.human_state}
Policy set by a separate controller: {policy}
Respect policy. Never infer raw EEG or vision states. Return concise Chinese JSON with content and renderer plan."""
    payload = {"model": os.getenv("DEEPSEEK_MODEL", "deepseek-chat"), "messages": [{"role": "system", "content": system}, *request.history, {"role": "user", "content": request.message}], "response_format": {"type": "json_object"}}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post("https://api.deepseek.com/chat/completions", headers={"Authorization": f"Bearer {api_key}"}, json=payload)
        response.raise_for_status()
    return {"mode": "deepseek", "policy": policy, "result": response.json()}
