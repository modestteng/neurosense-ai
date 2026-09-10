import { createRoot } from 'react-dom/client';
import Workspace from '../components/neuro/Workspace';
import { CHAT_API_URL } from './config';
import './base.css';

createRoot(document.getElementById('root')!).render(
  <Workspace staticDemo={!CHAT_API_URL} chatApiUrl={CHAT_API_URL || undefined} preferLive={Boolean(CHAT_API_URL)} />,
);
