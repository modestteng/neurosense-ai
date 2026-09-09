export type Scene = '学习' | '驾驶' | '办公' | '职业培训' | '客服' | '游戏 / VR';
export type Scenario = 'normal' | 'confused' | 'frustrated' | 'fatigued' | 'recovered';

export interface EEGState {
  emotion: 'Positive' | 'Neutral' | 'Negative';
  confidence: number;
  trend: 'rising' | 'stable' | 'recovering';
  duration: number;
  frontalResponse: number;
  temporalResponse: number;
  graphChange: number;
  stateStability: number;
  embedding: number[];
}

export interface HumanState {
  emotion: string;
  attention: number;
  confusion: number;
  fatigue: number;
  cognitiveLoad: number;
  frustration: number;
  engagement: number;
  trend: string;
  confidence: number;
}

export interface PolicyDecision {
  strategy: string;
  responseLength: string;
  difficulty: string;
  tone: string;
  formulaDensity: string;
  visualMode: string;
  useAnimation: boolean;
  askCheckQuestion: boolean;
  restRecommendation: boolean;
  safetyPriority: string;
}
