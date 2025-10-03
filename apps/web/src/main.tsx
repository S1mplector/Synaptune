import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './ui/App';
import { MinimalApp } from './ui/MinimalApp';

const params = new URLSearchParams(window.location.search);
const ux = params.get('ux');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {ux === 'minimal' ? <MinimalApp /> : <App />}
  </React.StrictMode>
);
