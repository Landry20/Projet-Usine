import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { ActualisationProvider } from './hooks/useActualisation';
import { AuthProvider } from './hooks/useAuth';
import { ChargementProvider } from './hooks/useChargement';
import { CompartimentProvider } from './hooks/useCompartiment';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CompartimentProvider>
          <ChargementProvider>
            <ActualisationProvider>
              <App />
            </ActualisationProvider>
          </ChargementProvider>
        </CompartimentProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
