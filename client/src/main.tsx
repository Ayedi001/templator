import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/base.css';
import './styles/marketing.css';
import './styles/template-mockup.css';
import './styles/site-renderer.css';
import './styles/dashboard.css';
import './styles/preview.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
