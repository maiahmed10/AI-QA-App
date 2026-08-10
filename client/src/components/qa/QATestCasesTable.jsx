import React, { useState } from 'react';
import { Search, Copy, Check, Download, FileCode, CheckSquare, AlertOctagon } from 'lucide-react';

const QATestCasesTable = ({ testCases = [], type = 'functional' }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [copiedAll, setCopiedAll] = useState(false);

    const title = type === 'functional' ? 'Functional Test Cases' : 'Negative Test Cases';
    const isFunctional = type === 'functional';

    // Filter test cases
    const filteredCases = testCases.filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            item.id.toLowerCase().includes(q) ||
            item.scenario.toLowerCase().includes(q) ||
            item.expected_result.toLowerCase().includes(q) ||
            (item.test_data && item.test_data.toLowerCase().includes(q)) ||
            (Array.isArray(item.steps) && item.steps.some(s => s.toLowerCase().includes(q)))
        );
    });

    // Copy single test case
    const handleCopySingle = (item) => {
        const stepsText = Array.isArray(item.steps)
            ? item.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
            : item.steps;

        const text = `**ID:** ${item.id}\n**Scenario:** ${item.scenario}\n**Steps:**\n${stepsText}\n**Test Data:** ${item.test_data}\n**Expected Result:** ${item.expected_result}`;
        navigator.clipboard.writeText(text);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Copy all as Jira Markdown format
    const handleCopyJiraFormat = () => {
        let jiraStr = `|| ID || Scenario || Steps || Test Data || Expected Result ||\n`;
        testCases.forEach((item) => {
            const stepsStr = Array.isArray(item.steps) ? item.steps.join(' \\\\ ') : item.steps;
            jiraStr += `| ${item.id} | ${item.scenario} | ${stepsStr} | ${item.test_data || 'N/A'} | ${item.expected_result} |\n`;
        });

        navigator.clipboard.writeText(jiraStr);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    // Export to CSV file
    const handleExportCSV = () => {
        const headers = ['ID', 'Scenario', 'Steps', 'Test Data', 'Expected Result'];
        const rows = testCases.map((item) => [
            `"${item.id}"`,
            `"${(item.scenario || '').replace(/"/g, '""')}"`,
            `"${(Array.isArray(item.steps) ? item.steps.join('; ') : item.steps || '').replace(/"/g, '""')}"`,
            `"${(item.test_data || '').replace(/"/g, '""')}"`,
            `"${(item.expected_result || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${type}_test_cases.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="qa-table-container">
            {/* Toolbar */}
            <div className="qa-table-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isFunctional ? (
                        <CheckSquare size={20} style={{ color: '#10B981' }} />
                    ) : (
                        <AlertOctagon size={20} style={{ color: '#6366F1' }} />
                    )}
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#FFF' }}>{title}</h3>
                        <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                            Showing {filteredCases.length} of {testCases.length} scenarios
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Search box */}
                    <div className="qa-search-box">
                        <Search size={15} style={{ color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="qa-search-input"
                            placeholder="Filter test cases..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Copy Jira Format */}
                    <button className="qa-btn-sm" onClick={handleCopyJiraFormat} title="Copy all as Jira format">
                        {copiedAll ? <Check size={14} style={{ color: '#10B981' }} /> : <FileCode size={14} />}
                        <span>{copiedAll ? 'Copied Jira' : 'Copy Jira'}</span>
                    </button>

                    {/* Export CSV */}
                    <button className="qa-btn-sm" onClick={handleExportCSV} title="Export to CSV file">
                        <Download size={14} />
                        <span>CSV</span>
                    </button>
                </div>
            </div>

            {/* Responsive Data Table */}
            <div className="qa-table-responsive">
                <table className="qa-table">
                    <thead>
                        <tr>
                            <th style={{ width: '110px' }}>ID</th>
                            <th style={{ width: '22%' }}>Scenario</th>
                            <th style={{ width: '32%' }}>Steps</th>
                            <th style={{ width: '20%' }}>Test Data</th>
                            <th style={{ width: '26%' }}>Expected Result</th>
                            <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCases.length > 0 ? (
                            filteredCases.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <span className="qa-tc-id">{item.id}</span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                                            {item.scenario}
                                        </div>
                                    </td>
                                    <td>
                                        {Array.isArray(item.steps) ? (
                                            <ol className="qa-tc-steps">
                                                {item.steps.map((step, idx) => (
                                                    <li key={idx}>{step}</li>
                                                ))}
                                            </ol>
                                        ) : (
                                            <div style={{ fontSize: '0.85rem' }}>{item.steps}</div>
                                        )}
                                    </td>
                                    <td>
                                        <div className="qa-tc-data">{item.test_data || 'N/A'}</div>
                                    </td>
                                    <td>
                                        <div style={{ color: '#A7F3D0', fontSize: '0.85rem', fontWeight: 500 }}>
                                            {item.expected_result}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            className="qa-btn-sm"
                                            onClick={() => handleCopySingle(item)}
                                            title="Copy single test case"
                                            style={{ padding: '0.3rem 0.5rem' }}
                                        >
                                            {copiedId === item.id ? (
                                                <Check size={14} style={{ color: '#10B981' }} />
                                            ) : (
                                                <Copy size={14} />
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                                    No test cases match your search filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default QATestCasesTable;
