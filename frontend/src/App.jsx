import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import WebhookConfig from './pages/WebhookConfig';
import ApiDocs from './pages/ApiDocs';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-100 font-sans">
                <Navbar />
                <main>
                    <Routes>
                        <Route path="/webhooks" element={<WebhookConfig />} />
                        <Route path="/docs" element={<ApiDocs />} />
                        <Route path="/" element={<Navigate to="/webhooks" replace />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
