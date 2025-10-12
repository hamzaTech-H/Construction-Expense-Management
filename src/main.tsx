import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { RouteProvider } from '@/providers/route-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import App from '@/App';
import '@/styles/globals.css';
 
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <HashRouter>
            <RouteProvider>
                <ThemeProvider>
                    <App />
                </ThemeProvider>
            </RouteProvider>
        </HashRouter>
    </React.StrictMode>
);