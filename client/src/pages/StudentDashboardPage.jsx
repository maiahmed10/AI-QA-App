import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MMCard, MMButton, MMBadge, MMAlert } from '../sdk';
import shadowmateService from '../services/shadowmateService';
import {
  Brain, RefreshCw, Calendar, Clock, Award,
  Sparkles, Plus, CheckCircle2, ArrowRight, TrendingUp
} from 'lucide-react';

const StudentDashboardPage = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replanStatus, setReplanStatus] = useState(null);
  const [isReplanning, setIsReplanning] = useState(false);

  // Quick session modal state
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [actualDuration, setActualDuration] = useState(45);
  const [focusScore, setFocusScore] = useState(4);
  const [feedbackRating, setFeedbackRating] = useState(3);
  const [feedbackComment, setFeedbackComment] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profData, assignData] = await Promise.all([
        shadowmateService.getProfile(),
        shadowmateService.getAssignments()
      ]);
      setProfile(profData);
      setAssignments(assignData);

      // Auto-trigger initial plan if none active
      const planRes = await shadowmateService.generateStudyPlan();
      setActivePlan(planRes.plan);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerReplan = async (reason = 'Manual refresh') => {
    try {
      setIsReplanning(true);
      const res = await shadowmateService.triggerReplan({
        reason,
        forceReplan: true
      });
      if (res.replanExecuted) {
        setActivePlan(res.newPlan);
        setReplanStatus({
          type: 'success',
          msg: `Adaptive Replanning Agent rebalanced your schedule: ${res.reason}`
        });
      } else {
        setReplanStatus({
          type: 'info',
          msg: res.message
        });
      }
    } catch (err) {
      console.error('Replan error:', err);
    } finally {
      setIsReplanning(false);
    }
  };

  const handleLogSession = async (e) => {
    e.preventDefault();
    try {
      const res = await shadowmateService.logSession({
        assignmentId: selectedTask?.id,
        courseCode: selectedTask?.course?.code || 'CS101',
        title: `Completed ${selectedTask?.title || 'Study Session'}`,
        plannedDuration: selectedTask?.estimatedMinutes || 45,
        actualDuration: parseInt(actualDuration),
        focusScore: parseInt(focusScore),
        completed: true
      });

      // Submit feedback if comment provided
      if (feedbackComment) {
        await shadowmateService.submitFeedback({
          assignmentId: selectedTask?.id,
          feedbackType: 'TIME_ESTIMATE',
          rating: parseInt(feedbackRating),
          comment: feedbackComment
        });
      }

      setShowLogModal(false);
      fetchDashboardData(); // Refresh memory profile
      if (res.replanRecommended?.shouldReplan) {
        handleTriggerReplan(res.replanRecommended.reason);
      }
    } catch (err) {
      console.error('Log session error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Loading ShadowMate Adaptive Dashboard...</p>
      </div>
    );
  }

  const paceRatio = profile?.avgActualVsEstRatio || 1.0;
  const pacePercentage = Math.round(paceRatio * 100);

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        background: 'linear-gradient(135deg, rgba(224,170,62,0.12) 0%, rgba(15,15,15,0.6) 100%)',
        padding: '1.5rem 2rem',
        borderRadius: '16px',
        border: '1px solid var(--primary-color)'
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--heading-font)',
            fontSize: '26px',
            color: 'var(--text-primary)',
            margin: '0 0 6px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <Brain style={{ color: 'var(--primary-color)' }} />
            ShadowMate Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
            Adaptive Learning Platform • Continuously learning your actual study behavior.
          </p>
        </div>

        <MMButton
          variant="primary"
          onClick={() => handleTriggerReplan('Manual button click')}
          disabled={isReplanning}
          style={{ gap: '8px' }}
        >
          <RefreshCw size={16} className={isReplanning ? 'animate-spin' : ''} />
          {isReplanning ? 'Replanning...' : '🔄 Adaptive Re-Plan'}
        </MMButton>
      </div>

      {replanStatus && (
        <div style={{ marginBottom: '1.5rem' }}>
          <MMAlert type={replanStatus.type} title="Adaptive Schedule Notice">
            {replanStatus.msg}
          </MMAlert>
        </div>
      )}

      {/* Grid Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        
        {/* Card 1: Pace Memory */}
        <MMCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Adaptive Pace Ratio</span>
            <TrendingUp size={18} style={{ color: 'var(--primary-color)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {pacePercentage}%
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {paceRatio < 0.95
              ? `You finish tasks ${100 - pacePercentage}% faster than estimated!`
              : paceRatio > 1.1
              ? `Tasks take ~${pacePercentage - 100}% longer than estimated.`
              : 'Your pace matches estimated durations closely.'}
          </p>
        </MMCard>

        {/* Card 2: Preferred Session Block */}
        <MMCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Target Study Block</span>
            <Clock size={18} style={{ color: 'var(--accent-color)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {profile?.preferredSessionDuration || 45} mins
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Peak Focus Hour: ~{profile?.focusPattern?.peakFocusHour || 16}:00
          </p>
        </MMCard>

        {/* Card 3: Memory Confidence */}
        <MMCard>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Memory Confidence Score</span>
            <Award size={18} style={{ color: 'var(--success-color)' }} />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {Math.round((profile?.dataConfidenceScore || 0.1) * 100)}%
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {profile?.dataConfidenceScore >= 0.3 ? 'Confidence level high for recommendations' : 'Log more study sessions to refine profile'}
          </p>
        </MMCard>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Today's Adaptive Schedule */}
        <MMCard title="📅 Active AI Study Schedule">
          {activePlan?.scheduleBreakdown && activePlan.scheduleBreakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {activePlan.scheduleBreakdown.slice(0, 5).map((slot, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '10px',
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {slot.assignmentTitle}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                      <span>🕒 {slot.startTime}</span>
                      <span>⏱️ {slot.durationMinutes} mins</span>
                      <span>📌 {slot.day}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--primary-color)', marginTop: '4px' }}>
                      💡 {slot.aiNote}
                    </div>
                  </div>

                  <MMButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedTask({ id: slot.assignmentId, title: slot.assignmentTitle, estimatedMinutes: slot.durationMinutes });
                      setShowLogModal(true);
                    }}
                  >
                    Log Session
                  </MMButton>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
              No active study blocks scheduled yet. Add assignments to generate your plan.
            </p>
          )}
        </MMCard>

        {/* Sidebar Widgets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Quick Assignments List */}
          <MMCard title="📝 Pending Tasks">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              {assignments.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Est: {item.estimatedMinutes}m | Status: {item.status}
                    </div>
                  </div>
                  <MMBadge variant={item.priority === 'URGENT' ? 'danger' : 'warning'}>
                    {item.priority}
                  </MMBadge>
                </div>
              ))}
            </div>
          </MMCard>

          {/* Transparent Memory Shortcut */}
          <MMCard title="🧠 Adaptive Memory">
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              ShadowMate observes your study habits and adjusts to your pace. You can view or override inferred parameters anytime.
            </p>
            <MMButton
              variant="outline"
              onClick={() => window.location.href = '/memory'}
              style={{ width: '100%' }}
            >
              Edit Memory Profile
            </MMButton>
          </MMCard>

        </div>

      </div>

      {/* Log Session Modal */}
      {showLogModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '480px',
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>
              Log Study Session & Feedback
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Task: <strong>{selectedTask?.title}</strong>
            </p>

            <form onSubmit={handleLogSession}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Actual Minutes Spent
                </label>
                <input
                  type="number"
                  value={actualDuration}
                  onChange={(e) => setActualDuration(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Focus Rating (1 to 5)
                </label>
                <select
                  value={focusScore}
                  onChange={(e) => setFocusScore(e.target.value)}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                >
                  <option value="5">5 - Deep Focus</option>
                  <option value="4">4 - High Focus</option>
                  <option value="3">3 - Moderate Focus</option>
                  <option value="2">2 - Distracted</option>
                  <option value="1">1 - Very Low Focus</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Optional Feedback (Helps AI adapt future estimates)
                </label>
                <textarea
                  placeholder="e.g., 'This task took longer than expected' or 'I prefer shorter sessions'"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <MMButton variant="ghost" type="button" onClick={() => setShowLogModal(false)}>
                  Cancel
                </MMButton>
                <MMButton variant="primary" type="submit">
                  Log & Train AI
                </MMButton>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentDashboardPage;
