import React, { useState } from 'react';
import { initialTestCasesData, initialBugsData } from '../data/qaTestData';
import { CheckCircle2, XCircle, AlertCircle, Clock, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

const mockHistoryLogs = [
    {
        id: 'LOG-1008',
        timestamp: '2026-08-10 15:24:33',
        testCaseId: 'TC-001',
        name: 'Valid non-empty message payload',
        status: 'PASS',
        score: '100%',
        endpoint: 'POST /api/messages',
        latency: '8 ms',
        details: 'HTTP 200 OK returned. Message accepted by Express server.'
    },
    {
        id: 'LOG-1007',
        timestamp: '2026-08-10 15:20:12',
        testCaseId: 'TC-002',
        name: 'Empty message validation check',
        status: 'FAIL',
        score: '50%',
        endpoint: 'POST /api/messages',
        latency: '12 ms',
        details: 'BUG-001 Defect Detected: Endpoint accepted empty string "" with HTTP 200 OK instead of HTTP 400 Bad Request.'
    },
    {
        id: 'LOG-1006',
        timestamp: '2026-08-10 15:15:00',
        testCaseId: 'TC-003',
        name: 'Missing message field payload',
        status: 'PASS',
        score: '100%',
        endpoint: 'POST /api/messages',
        latency: '6 ms',
        details: 'HTTP 400 Bad Request correctly returned for missing parameter.'
    },
    {
        id: 'LOG-1005',
        timestamp: '2026-08-10 15:00:22',
        testCaseId: 'TC-006',
        name: 'Special characters & XSS payload',
        status: 'PASS',
        score: '100%',
        endpoint: 'POST /api/messages',
        latency: '15 ms',
        details: 'Payload sanitized and handled securely.'
    },
    {
        id: 'LOG-1004',
        timestamp: '2026-08-10 14:45:10',
        testCaseId: 'TC-007',
        name: 'Long input string payload (10,000 chars)',
        status: 'PASS',
        score: '100%',
        endpoint: 'POST /api/messages',
        latency: '24 ms',
        details: 'Processed without memory spike or timeout.'
    }
];

const QATestResultsPage = () => {
    const [expandedLog, setExpandedLog] = useState(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', color: '#E2E8F0' }}>
            {/* Header */}
            <div>
                <span className="font-mono" style={{ fontSize: '0.75rem', color: '#E0AA3E', fontWeight: 700 }}>HISTORICAL EXECUTION LOGS</span>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>Test Results & Execution History</h1>
            </div>

            {/* Results Table Card */}
            <div className="qa-card" style={{ padding: '1.25rem' }}>
                <div className="qa-table-wrapper">
                    <table className="qa-table">
                        <thead>
                            <tr>
                                <th style={{ width: '100px' }}>Log ID</th>
                                <th style={{ width: '160px' }}>Timestamp</th>
                                <th>Test Case & Endpoint</th>
                                <th style={{ width: '110px' }}>Status</th>
                                <th style={{ width: '90px' }}>Score</th>
                                <th style={{ width: '90px' }}>Latency</th>
                                <th style={{ width: '50px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockHistoryLogs.map((log) => {
                                const isExpanded = expandedLog === log.id;

                                return (
                                    <React.Fragment key={log.id}>
                                        <tr
                                            className={`mm-tr ${log.status === 'FAIL' ? 'tr-fail' : ''}`}
                                            onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td className="font-mono text-gold fw-bold">{log.id}</td>
                                            <td className="font-mono text-muted-fg" style={{ fontSize: '0.8rem' }}>
                                                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                {log.timestamp}
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#FFF' }}>{log.name}</div>
                                                <div className="font-mono" style={{ fontSize: '0.75rem', color: '#888' }}>{log.endpoint}</div>
                                            </td>
                                            <td>
                                                <span className={`qa-badge ${log.status === 'PASS' ? 'badge-pass' : 'badge-fail'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="font-mono fw-bold text-gold">{log.score}</td>
                                            <td className="font-mono text-muted-fg">{log.latency}</td>
                                            <td>
                                                <button className="mm-expand-btn" style={{ background: 'transparent', border: 'none', color: '#888' }}>
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="mm-tr-details">
                                                <td colSpan={7}>
                                                    <div style={{ padding: '0.85rem 1rem', background: '#0D0D0D', borderRadius: '8px', border: '1px solid #222', fontSize: '0.825rem' }}>
                                                        <div style={{ color: '#E0AA3E', fontWeight: 700, marginBottom: '0.3rem' }}>Execution Details & Diagnostic Note:</div>
                                                        <div style={{ color: '#DDD', lineHeight: 1.5 }}>{log.details}</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default QATestResultsPage;
