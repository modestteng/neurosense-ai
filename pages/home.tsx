import { createRoot } from 'react-dom/client';
import Home from '../app/page';
import './base.css';

createRoot(document.getElementById('root')!).render(<Home basePath={import.meta.env.BASE_URL} />);
