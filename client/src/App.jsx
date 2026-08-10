import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QAAuthProvider } from './context/QAAuthContext';
import QALayout from './components/QALayout';
import QAProtectedRoute from './components/QAProtectedRoute';
import QALoginPage from './pages/QALoginPage';

// Multi-Page Application Views
const QATestingAssistantPage = lazy(() => import('./pages/QATestingAssistantPage'));
const AIQATestingPage = lazy(() => import('./pages/AIQATestingPage'));
const AIQAChatbotPage = lazy(() => import('./pages/AIQAChatbotPage'));
const QATestCasesPage = lazy(() => import('./pages/QATestCasesPage'));
const QATestResultsPage = lazy(() => import('./pages/QATestResultsPage'));
const QATestingHistoryPage = lazy(() => import('./pages/QATestingHistoryPage'));
const QASettingsPage = lazy(() => import('./pages/QASettingsPage'));

// Preserved Legacy Pages
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const ManagerLayout = lazy(() => import('./components/ManagerLayout'));
const StudentDashboardPage = lazy(() => import('./pages/StudentDashboardPage'));
const StudyPlannerPage = lazy(() => import('./pages/StudyPlannerPage'));
const AssignmentsPage = lazy(() => import('./pages/AssignmentsPage'));
const TrackRecommendationPage = lazy(() => import('./pages/TrackRecommendationPage'));
const StudentProfileMemoryPage = lazy(() => import('./pages/StudentProfileMemoryPage'));
const AdminTracksPage = lazy(() => import('./pages/AdminTracksPage'));

const CoPilotsPage = lazy(() => import('./pages/CoPilotsPage'));
const DocumentsLibrary = lazy(() => import('./pages/DocumentsLibrary'));
const DashboardsPage = lazy(() => import('./pages/DashboardsPage'));
const ReportBotPage = lazy(() => import('./pages/ReportBotPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CampusPage = lazy(() => import('./pages/CampusPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const DocsViewer = lazy(() => import('./pages/DocsViewer'));

// Branded Loading Fallback
const LoadingFallback = () => (
    <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page, #0F0F0F)',
        color: 'var(--text-primary, #F2F3EC)',
    }}>
        <div style={{ textAlign: 'center' }}>
            <div style={{
                position: 'relative',
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
            }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '3px solid rgba(224,170,62,0.15)',
                    borderTopColor: '#E0AA3E',
                    animation: 'mm-spin 1s linear infinite',
                }} />
            </div>
            <div style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#E0AA3E',
                marginBottom: '6px',
            }}>MicroMind QA Suite</div>
            <div style={{
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                color: '#888',
            }}>Loading Professional App...</div>
        </div>
        <style>{`
            @keyframes mm-spin {
                to { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

function App() {
    return (
        <QAAuthProvider>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    {/* Page 1: Login Route */}
                    <Route path="/login" element={<QALoginPage />} />

                    {/* Protected Application Routes (Pages 2-6) */}
                    <Route element={<QAProtectedRoute />}>
                        <Route element={<QALayout />}>
                            {/* Page 2: Dashboard */}
                            <Route path="/" element={<QATestingAssistantPage />} />
                            <Route path="/dashboard" element={<QATestingAssistantPage />} />
                            <Route path="/qa" element={<QATestingAssistantPage />} />

                            {/* Page 3: AI QA Testing Workspace */}
                            <Route path="/ai-qa-testing" element={<AIQATestingPage />} />
                            <Route path="/qa-workspace" element={<AIQATestingPage />} />

                            {/* Dedicated AI QA Assistant Chatbot */}
                            <Route path="/ai-assistant" element={<AIQAChatbotPage />} />
                            <Route path="/chat" element={<AIQAChatbotPage />} />

                            {/* Page 4: Test Cases Management */}
                            <Route path="/test-cases" element={<QATestCasesPage />} />

                            {/* Page 5: Test Results / History */}
                            <Route path="/test-results" element={<QATestResultsPage />} />
                            <Route path="/history" element={<QATestResultsPage />} />
                            <Route path="/testing-history" element={<QATestingHistoryPage />} />

                            {/* Page 6: Settings */}
                            <Route path="/settings" element={<QASettingsPage />} />
                        </Route>
                    </Route>

                    {/* Preserved Legacy ShadowMate Routes */}
                    <Route path="/shadowmate" element={<ProtectedRoute />}>
                        <Route element={<ManagerLayout />}>
                            <Route path="dashboard" element={<StudentDashboardPage />} />
                            <Route path="planner" element={<StudyPlannerPage />} />
                            <Route path="assignments" element={<AssignmentsPage />} />
                            <Route path="recommendations" element={<TrackRecommendationPage />} />
                            <Route path="memory" element={<StudentProfileMemoryPage />} />
                            <Route path="admin/tracks" element={<AdminTracksPage />} />
                            <Route path="copilots" element={<CoPilotsPage />} />
                            <Route path="documents" element={<DocumentsLibrary />} />
                            <Route path="analytics/dashboards" element={<DashboardsPage />} />
                            <Route path="report-bot" element={<ReportBotPage />} />
                            <Route path="reports" element={<ReportsPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="campus" element={<CampusPage />} />
                            <Route path="docs" element={<DocsPage />} />
                            <Route path="docs/:slug" element={<DocsViewer />} />
                        </Route>
                    </Route>

                    {/* Fallback redirect */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Suspense>
        </QAAuthProvider>
    );
}

export default App;
