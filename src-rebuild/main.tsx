import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';


const root = document.getElementById('root');

if (!root) {
  throw new Error(
    '[MalwaNamkeen] Root element #root not found. ' +
    'Ensure index.html contains <div id="root"></div>.',
  );
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
