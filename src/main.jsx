import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

import './styles/base.css';
import './styles/shell.css';
import './styles/stage.css';
import './styles/games.css';
import './styles/quiz.css';
import './styles/mind.css';
import './styles/arcade2.css';
import './styles/arcade3.css';
import './styles/mobile.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
