import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import App from './App';
import './index.css';
import './i18n'; // ⬅️ เพิ่มบรรทัดนี้ก่อน App render


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <Router>
        <App />
      </Router>
    </SnackbarProvider>
  </React.StrictMode>
);
