import { createRoot } from 'react-dom/client';
import Workspace from '../components/neuro/Workspace';
import './base.css';

createRoot(document.getElementById('root')!).render(<Workspace staticDemo />);
