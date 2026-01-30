import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Headers for auth (hardcoded for demo/simplicity as per instructions implies simple auth or pre-seeded)
// In real app, we'd have login. Here we use the hardcoded test credentials.
const AUTH_HEADERS = {
    'X-Api-Key': 'key_test_abc123',
    'X-Api-Secret': 'secret_test_xyz789'
};

const WebhookConfig = () => {
    const [webhookUrl, setWebhookUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchConfig = async () => {
        try {
            const res = await axios.get(`${API_URL}/webhooks/config`, { headers: AUTH_HEADERS });
            setWebhookUrl(res.data.webhook_url || '');
            setSecret(res.data.webhook_secret || '');
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${API_URL}/webhooks`, { headers: AUTH_HEADERS });
            setLogs(res.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchConfig();
        const interval = setInterval(fetchLogs, 5000); // Poll logs
        fetchLogs();
        return () => clearInterval(interval);
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/webhooks/config`, { webhook_url: webhookUrl }, { headers: AUTH_HEADERS });
            alert('Saved');
            fetchConfig();
        } catch (err) {
            alert('Error');
        }
    };

    const handleRegenerate = async () => {
        if (!confirm('Regenerate secret?')) return;
        try {
            await axios.post(`${API_URL}/webhooks/config`, { regenerate_secret: true }, { headers: AUTH_HEADERS });
            fetchConfig();
        } catch (err) {
            alert('Error');
        }
    };

    const handleTest = async () => {
        try {
            await axios.post(`${API_URL}/webhooks/test`, {}, { headers: AUTH_HEADERS });
            alert('Test webhook scheduled');
        } catch (err) {
            alert('Error sending test webhook');
        }
    };

    const handleRetry = async (id) => {
        try {
            await axios.post(`${API_URL}/webhooks/${id}/retry`, {}, { headers: AUTH_HEADERS });
            alert('Retry scheduled');
            fetchLogs();
        } catch (err) {
            alert('Retry failed');
        }
    }

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 mb-6" data-testid="webhook-config">
                <h2 className="text-lg font-medium leading-6 text-gray-900">Webhook Configuration</h2>

                <form onSubmit={handleSave} className="mt-5 space-y-6" data-testid="webhook-config-form">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Webhook URL</label>
                        <input
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="https://yoursite.com/webhook"
                            data-testid="webhook-url-input"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Webhook Secret</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm" data-testid="webhook-secret">
                                {secret}
                            </span>
                            <button
                                type="button"
                                onClick={handleRegenerate}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-r-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                data-testid="regenerate-secret-button"
                            >
                                Regenerate
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            data-testid="save-webhook-button"
                        >
                            Save Configuration
                        </button>
                        <button
                            type="button"
                            onClick={handleTest}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            data-testid="test-webhook-button"
                        >
                            Send Test Webhook
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6" data-testid="webhook-logs-table">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Webhook Logs</h3>
                <div className="flex flex-col">
                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Attempt</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {logs.map((log) => (
                                            <tr key={log.id} data-testid="webhook-log-item" data-webhook-id={log.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-testid="webhook-event">{log.event}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid="webhook-status">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-800' : (log.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid="webhook-attempts">{log.attempts}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid="webhook-last-attempt">
                                                    {log.last_attempt_at ? new Date(log.last_attempt_at).toLocaleString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-testid="webhook-response-code">{log.response_code || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {log.status !== 'success' && (
                                                        <button
                                                            onClick={() => handleRetry(log.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            data-testid="retry-webhook-button"
                                                            data-webhook-id={log.id}
                                                        >
                                                            Retry
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebhookConfig;
