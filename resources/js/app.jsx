import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import MainApp from './MainApp.jsx';
import '../css/app.css';

const rootElement = document.getElementById('root');
if (rootElement) {
    createRoot(rootElement).render(
        <React.StrictMode>
            <MainApp />
        </React.StrictMode>
    );
}
