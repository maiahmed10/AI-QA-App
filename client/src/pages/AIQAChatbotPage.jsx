import React, { useState, useEffect, useRef } from 'react';
import { useQAAuth } from '../context/QAAuthContext';
import {
    Bot,
    Send,
    Plus,
    MessageSquare,
    Clock,
    Trash2,
    Copy,
    Check,
    FileText,
    Paperclip,
    RefreshCw,
    Search,
    ChevronLeft,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import './AIQAChatbotPage.css';

const STORAGE_CONVERSATIONS_KEY = 'qa_chat_conversations_v2';
const STORAGE_ACTIVE_ID_KEY = 'qa_active_conversation_id_v2';

// Preset Prompts for Quick Testing Questions
const PRESET_PROMPTS = [
    {
        icon: '❌',
        title: 'Why did this test fail?',
        prompt: 'Why did this test fail? Please analyze the root cause based on the expected vs actual response.'
    },
    {
        icon: '💡',
        title: 'Explain this QA result',
        prompt: 'Explain this QA result in detail including the status code, score breakdown, and recommendations.'
    },
    {
        icon: '⚡',
        title: 'Generate test cases for this API',
        prompt: 'Generate comprehensive positive, negative, and edge-case test scenarios for this API requirement.'
    },
    {
        icon: '🛡️',
        title: 'What edge cases should I test?',
        prompt: 'What critical boundary conditions and security edge cases should I test for this specification?'
    },
    {
        icon: '✨',
        title: 'How can I improve this AI response?',
        prompt: 'How can I improve the quality, completeness, and schema validation of this AI response?'
    }
];

const createDefaultConversation = (user) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return {
        id: `conv_${Date.now()}`,
        title: 'New QA Assistance Session',
        date: dateStr,
        time: timeStr,
        updatedAt: Date.now(),
        messages: [
            {
                id: `msg-${Date.now()}`,
                sender: 'assistant',
                timestamp: timeStr,
                text: `👋 Hello ${user?.name || 'QA Engineer'}! I am your **MicroMind AI QA Assistant**.

I can help you analyze test failures, generate test suites, evaluate AI responses, and identify security edge cases.

Select a preset question below or type your custom QA question to get started!`
            }
        ]
    };
};

const AIQAChatbotPage = () => {
    const { user } = useQAAuth();

    // Default attached QA context
    const [qaContext] = useState({
        question: 'Test POST /api/messages. The API accepts a required non-empty message parameter.',
        response: 'The endpoint returns HTTP 200 OK for valid strings and HTTP 400 Bad Request for missing or empty inputs.',
        status: 'FAIL',
        score: '50%',
        issues: ['Empty string parameter accepted with HTTP 200 OK instead of HTTP 400 Bad Request.'],
        feedback: 'Validation middleware bypass detected. Empty payload should be rejected at API ingress.'
    });

    const [isContextAttached, setIsContextAttached] = useState(true);
    const [inputPrompt, setInputPrompt] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [historySearchQuery, setHistorySearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Multi-Conversation State with LocalStorage Persistence
    const [conversations, setConversations] = useState(() => {
        const saved = localStorage.getItem(STORAGE_CONVERSATIONS_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) {
                console.warn('Failed to parse chat conversations from localStorage:', e);
            }
        }
        return [createDefaultConversation(user)];
    });

    const [activeConvId, setActiveConvId] = useState(() => {
        const savedId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
        if (savedId && savedId.trim() !== '') return savedId;
        return null;
    });

    // Ensure valid active conversation ID
    useEffect(() => {
        if (!activeConvId || !conversations.some(c => c.id === activeConvId)) {
            if (conversations.length > 0) {
                setActiveConvId(conversations[0].id);
            } else {
                const newConv = createDefaultConversation(user);
                setConversations([newConv]);
                setActiveConvId(newConv.id);
            }
        }
    }, [activeConvId, conversations, user]);

    // Persist Conversations to LocalStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_CONVERSATIONS_KEY, JSON.stringify(conversations));
        } catch (e) {
            console.warn('LocalStorage save error:', e);
        }
    }, [conversations]);

    // Persist Active Conversation ID
    useEffect(() => {
        if (activeConvId) {
            localStorage.setItem(STORAGE_ACTIVE_ID_KEY, activeConvId);
        }
    }, [activeConvId]);

    // Get current active conversation
    const activeConversation = conversations.find(c => c.id === activeConvId) || conversations[0] || createDefaultConversation(user);

    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [activeConversation?.messages, isTyping]);

    // Create New Conversation
    const handleNewChat = () => {
        const newConv = createDefaultConversation(user);
        setConversations(prev => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        setInputPrompt('');
    };

    // Delete Conversation
    const handleDeleteConversation = (convId, e) => {
        e.stopPropagation();
        if (window.confirm('Delete this conversation history?')) {
            setConversations(prev => {
                const updated = prev.filter(c => c.id !== convId);
                if (updated.length === 0) {
                    const freshConv = createDefaultConversation(user);
                    setActiveConvId(freshConv.id);
                    return [freshConv];
                }
                if (convId === activeConvId) {
                    setActiveConvId(updated[0].id);
                }
                return updated;
            });
        }
    };

    // Copy message text helper
    const handleCopyText = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Dynamic AI QA Response Engine
    const generateAIAnswer = (promptText, attachedCtx) => {
        const lower = promptText.toLowerCase();
        const ctxStr = attachedCtx
            ? `\n\n📌 **Attached Test Context**:\n- **Question**: "${attachedCtx.question}"\n- **Response**: "${attachedCtx.response}"\n- **Status**: ${attachedCtx.status} | **Score**: ${attachedCtx.score}\n- **Issues**: ${attachedCtx.issues?.join(', ') || 'None'}`
            : '';

        if (lower.includes('why did') || lower.includes('fail') || lower.includes('root cause')) {
            return `🔍 **Root Cause Analysis of Test Failure**:

The test failed because the API endpoint returned **HTTP 200 OK** when an empty payload \`{"message": ""}\` was transmitted, whereas the specification expected an **HTTP 400 Bad Request** validation error.

### 🛠️ Key Defect Details:
1. **Defect Type**: Validation Middleware Bypass (\`BUG-001\`)
2. **Impact**: Unvalidated empty strings enter downstream data storage and cause null-pointer runtime errors.
3. **Severity**: Medium

### 💡 Remediation Code Fix:
In \`server/src/routes/messages.js\`, enforce string trimming check:
\`\`\`javascript
if (!req.body.message || req.body.message.trim().length === 0) {
    return res.status(400).json({ error: 'Bad Request', message: 'Message field must not be empty' });
}
\`\`\`${ctxStr}`;
        }

        if (lower.includes('explain') || lower.includes('qa result') || lower.includes('score')) {
            return `📊 **Detailed QA Workflow Result Explanation**:

- **Overall Status**: **${attachedCtx?.status || 'PASS'}**
- **Quality Score**: **${attachedCtx?.score || '95%'}**

### 📝 Evaluation Summary:
The test execution verified core parameter ingress. Parameter typing and structural validation passed, but boundary value validation failed for zero-length strings.

### 🎯 Key Recommendations:
1. Implement input sanitization middleware before controller dispatch.
2. Add automated regression tests for empty \`""\`, whitespace \`"   "\`, and missing \`{}\` fields.${ctxStr}`;
        }

        if (lower.includes('generate') || lower.includes('test cases') || lower.includes('api')) {
            return `⚡ **Generated Comprehensive Test Cases**:

Here is the generated test suite for your API specification:

| Test ID | Scenario Description | Expected Result | Type |
| :--- | :--- | :--- | :--- |
| **TC-001** | Valid non-empty string payload | \`HTTP 200 OK\` | Positive |
| **TC-002** | Empty string payload \`{"message": ""}\` | \`HTTP 400 Bad Request\` | Negative |
| **TC-003** | Missing required parameter field | \`HTTP 400 Bad Request\` | Negative |
| **TC-004** | Invalid parameter data type (numeric/bool) | \`HTTP 400 Bad Request\` | Negative |
| **TC-005** | Special characters & XSS injection | \`HTTP 200 OK\` (Sanitized) | Edge Case |
| **TC-006** | Excessively long input (>5,000 chars) | \`HTTP 400 Bad Request\` | Boundary |

Would you like me to export these test cases directly to your **Test Cases Workspace**?${ctxStr}`;
        }

        if (lower.includes('edge') || lower.includes('boundary') || lower.includes('security')) {
            return `🛡️ **Recommended Edge Cases & Security Scenarios**:

Here are critical edge cases you should test:

1. **Whitespace Only Injection**: \`{"message": "     "}\` — Should be trimmed and rejected as empty.
2. **Null & Undefined Types**: \`{"message": null}\` — Should be caught by type validation without server 500 error.
3. **XSS Payload Injection**: \`{"message": "<script>alert(1)</script>"}\` — Verify HTML escaping.
4. **Unicode & RTL Characters**: \`{"message": "مرحبا 🤖 测试"}\` — Verify UTF-8 character encoding.
5. **Concurrent Double Submission**: Send 2 identical requests within 10ms to test race conditions.${ctxStr}`;
        }

        if (lower.includes('improve') || lower.includes('ai response') || lower.includes('schema')) {
            return `✨ **AI Response Improvement Recommendations**:

To improve the accuracy and schema consistency of this AI response:

1. **Add Explicit JSON Schema**: Define expected mandatory keys (\`status\`, \`score\`, \`issues\`, \`feedback\`).
2. **Enforce Temperature Control**: Set \`temperature: 0.1\` for deterministic, repeatable QA output.
3. **Include Strict Types**: Require HTTP status codes to be explicit integers (e.g. \`400\` instead of \`"error"\`).
4. **Structured Defect Taxonomy**: Use standardized severity levels (\`Low\`, \`Medium\`, \`High\`, \`Critical\`).${ctxStr}`;
        }

        return `🤖 **MicroMind QA Assistant**:

I have analyzed your query: "${promptText}".

Based on software testing best practices and your current QA suite:
- All mandatory parameter inputs should enforce strict boundary checking.
- Negative test scenarios should expect descriptive HTTP error response bodies.
- You can run live verification requests directly in the **Interactive Live API Runner**.

Let me know if you would like me to generate code fixes or additional test payloads!${ctxStr}`;
    };

    // Send Message Handler
    const handleSendMessage = (textToSend) => {
        const query = textToSend || inputPrompt.trim();
        if (!query || isTyping || !activeConversation) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const userMsg = {
            id: `msg-${Date.now()}`,
            sender: 'user',
            timestamp: timeStr,
            text: query
        };

        // Determine title from 1st user query if default
        const isFirstUserMsg = activeConversation.messages.filter(m => m.sender === 'user').length === 0;
        const newTitle = isFirstUserMsg ? (query.length > 32 ? query.substring(0, 32) + '...' : query) : activeConversation.title;

        // Append user message & update title
        setConversations(prev =>
            prev.map(c => {
                if (c.id === activeConversation.id) {
                    return {
                        ...c,
                        title: newTitle,
                        updatedAt: Date.now(),
                        messages: [...c.messages, userMsg]
                    };
                }
                return c;
            })
        );

        setInputPrompt('');
        setIsTyping(true);

        // Generate AI Answer & Append
        setTimeout(() => {
            const aiText = generateAIAnswer(query, isContextAttached ? qaContext : null);
            const aiMsg = {
                id: `msg-${Date.now() + 1}`,
                sender: 'assistant',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                text: aiText
            };

            setConversations(prev =>
                prev.map(c => {
                    if (c.id === activeConversation.id) {
                        return {
                            ...c,
                            updatedAt: Date.now(),
                            messages: [...c.messages, aiMsg]
                        };
                    }
                    return c;
                })
            );
            setIsTyping(false);
        }, 600);
    };

    // Filter conversations for history sidebar
    const filteredConversations = conversations.filter(c =>
        c.title.toLowerCase().includes(historySearchQuery.toLowerCase())
    );

    return (
        <div className="qa-chat-workspace">
            {/* Left Sidebar: Chat History Panel */}
            <aside className={`qa-history-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
                <div className="qa-history-header">
                    <button onClick={handleNewChat} className="qa-new-chat-btn">
                        <Plus size={16} />
                        <span>New Chat</span>
                    </button>
                </div>

                {/* Search Bar for Conversations */}
                <div className="qa-history-search">
                    <Search size={14} className="text-muted" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={historySearchQuery}
                        onChange={(e) => setHistorySearchQuery(e.target.value)}
                        className="qa-history-search-input font-mono"
                    />
                </div>

                {/* History Conversations List */}
                <div className="qa-history-list">
                    <div className="qa-history-section-title font-mono">
                        <span>PAST CONVERSATIONS ({filteredConversations.length})</span>
                    </div>

                    {filteredConversations.map((conv) => {
                        const isActive = conv.id === activeConversation.id;

                        return (
                            <div
                                key={conv.id}
                                className={`qa-history-item ${isActive ? 'active' : ''}`}
                                onClick={() => setActiveConvId(conv.id)}
                            >
                                <div className="qa-history-item-icon">
                                    <MessageSquare size={15} />
                                </div>
                                <div className="qa-history-item-info">
                                    <span className="qa-history-item-title">{conv.title}</span>
                                    <span className="qa-history-item-date font-mono">
                                        <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                                        {conv.date} {conv.time}
                                    </span>
                                </div>
                                <button
                                    className="qa-history-delete-btn"
                                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                                    title="Delete conversation"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </aside>

            {/* Right Panel: Main Chatbot Workspace */}
            <main className="qa-chat-main">
                {/* Page Header (No top border / divider) */}
                <header className="qa-chat-header">
                    <div className="qa-chat-header-title font-mono">
                        <button
                            className="qa-sidebar-toggle-btn"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            title="Toggle Chat History Panel"
                        >
                            {isSidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <div className="qa-chat-logo">
                            <Bot size={22} />
                        </div>
                        <div>
                            <div className="qa-chat-badge">SPECIALIZED QA AGENT</div>
                            <h1 className="qa-chat-title">{activeConversation.title}</h1>
                        </div>
                    </div>

                    <div className="qa-chat-header-actions">
                        <button
                            className={`qa-context-toggle-btn ${isContextAttached ? 'active' : ''}`}
                            onClick={() => setIsContextAttached(!isContextAttached)}
                            title="Toggle Test Case Context Attachment"
                        >
                            <Paperclip size={15} />
                            <span>{isContextAttached ? 'Context Attached' : 'Attach Context'}</span>
                        </button>
                    </div>
                </header>

                {/* Context Info Banner */}
                {isContextAttached && (
                    <div className="qa-context-banner">
                        <FileText size={16} className="text-gold" />
                        <div className="qa-context-details">
                            <span className="fw-bold text-gold">Attached Test Context:</span>
                            <span>"{qaContext.question.slice(0, 65)}..."</span>
                            <span className={`qa-badge ${qaContext.status === 'PASS' ? 'badge-pass' : 'badge-fail'}`}>
                                {qaContext.status} ({qaContext.score})
                            </span>
                        </div>
                    </div>
                )}

                {/* Quick Preset Prompts Bar */}
                <div className="qa-preset-bar">
                    {PRESET_PROMPTS.map((item, idx) => (
                        <button
                            key={idx}
                            className="qa-preset-chip"
                            onClick={() => handleSendMessage(item.prompt)}
                            disabled={isTyping}
                        >
                            <span>{item.icon}</span>
                            <span>{item.title}</span>
                        </button>
                    ))}
                </div>

                {/* Chat Messages Container */}
                <div className="qa-messages-box">
                    {activeConversation.messages.map((msg, idx) => (
                        <div
                            key={msg.id}
                            className={`qa-message-row ${msg.sender === 'user' ? 'row-user' : 'row-assistant'}`}
                        >
                            <div className="qa-avatar-box">
                                {msg.sender === 'user' ? (
                                    <div className="qa-user-avatar">{user?.name?.charAt(0) || 'U'}</div>
                                ) : (
                                    <div className="qa-bot-avatar">
                                        <Bot size={18} />
                                    </div>
                                )}
                            </div>

                            <div className="qa-bubble-box">
                                <div className="qa-bubble-header">
                                    <span className="qa-bubble-name">
                                        {msg.sender === 'user' ? user?.name || 'QA Engineer' : 'MicroMind AI QA Agent'}
                                    </span>
                                    <span className="qa-bubble-time">{msg.timestamp}</span>

                                    {msg.sender === 'assistant' && (
                                        <button
                                            onClick={() => handleCopyText(msg.text, idx)}
                                            className="qa-copy-msg-btn"
                                            title="Copy text"
                                        >
                                            {copiedIndex === idx ? <Check size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
                                        </button>
                                    )}
                                </div>

                                <div className="qa-bubble-content">
                                    {msg.text.split('\n').map((paragraph, pIdx) => {
                                        if (paragraph.startsWith('### ')) {
                                            return <h4 key={pIdx} className="qa-md-h4">{paragraph.replace('### ', '')}</h4>;
                                        }
                                        if (paragraph.startsWith('## ')) {
                                            return <h3 key={pIdx} className="qa-md-h3">{paragraph.replace('## ', '')}</h3>;
                                        }
                                        if (paragraph.startsWith('* ') || paragraph.startsWith('- ')) {
                                            return <li key={pIdx} className="qa-md-li">{paragraph.slice(2)}</li>;
                                        }
                                        return <p key={pIdx} className="qa-md-p">{paragraph}</p>;
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing State Indicator */}
                    {isTyping && (
                        <div className="qa-message-row row-assistant">
                            <div className="qa-avatar-box">
                                <div className="qa-bot-avatar">
                                    <Bot size={18} />
                                </div>
                            </div>
                            <div className="qa-bubble-box qa-typing-bubble">
                                <RefreshCw size={16} className="qa-spin text-gold" />
                                <span>MicroMind QA Agent is analyzing test context...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Footer Bar */}
                <div className="qa-chat-input-bar">
                    <textarea
                        value={inputPrompt}
                        onChange={(e) => setInputPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        rows={2}
                        className="qa-chat-textarea"
                        placeholder="Ask any question about test failures, edge cases, API test generation... (Press Enter to send)"
                        disabled={isTyping}
                    />

                    <button
                        onClick={() => handleSendMessage()}
                        disabled={isTyping || !inputPrompt.trim()}
                        className="qa-send-btn"
                        title="Send message"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </main>
        </div>
    );
};

export default AIQAChatbotPage;
