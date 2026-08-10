import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MMCard, MMButton, MMBadge, MMAlert } from '../sdk';
import shadowmateService from '../services/shadowmateService';
import { Calendar, RefreshCw, Clock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

const StudyPlannerPage = () => {
  const { t } = useTranslation();
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isReplanning, setIsReplanning] = useState(false);
  const [replanNotice, setReplanNotice] = useState(null);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await shadowmateService.generateStudyPlan();
      setActivePlan(res.plan);
    } catch (err) {
      console.error('Error fetching study plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplan = async (reason, forceReplan = true) => {
    try {
      setIsReplanning(true);
      const res = await shadowmateService.triggerReplan({ reason, forceReplan });
      if (res.replanExecuted) {
        setActivePlan(res.newPlan);
        setReplanNotice({ type: 'success', msg: `Plan updated: ${res.reason}` });
      } else {
        setReplanNotice({ type: 'info', msg: res.message });
      }
    } catch (err) {
      console.error('Replan error:', err);
    } finally {
      setIsReplanning(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Loading AI Study Schedule...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{
          fontFamily: 'var(--heading-font)',
          fontSize: '26px',
          color: 'var(--text-primary)',
          margin: '0 0 6px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Calendar style={{ color: 'var(--primary-color)' }} />
          Adaptive Study Planner & Rebalancing
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
          Continuously adapts your study blocks as your pace, availability, and deadlines change.
        </p>
      </div>

      {/* Visual ShadowMate Loop Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ fontWeight: '600', color: 'var(--primary-color)' }}>Plan</div>
        <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
        <div style={{ fontWeight: '600', color: 'var(--accent-color)' }}>Study</div>
        <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
        <div style={{ fontWeight: '600', color: 'var(--warning-color)' }}>Observe</div>
        <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
        <div style={{ fontWeight: '600', color: 'var(--success-color)' }}>Learn</div>
        <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
        <div style={{ fontWeight: '600', color: 'var(--primary-color)' }}>Replan</div>
      </div>

      {replanNotice && (
        <div style={{ marginBottom: '1.5rem' }}>
          <MMAlert type={replanNotice.type} title="Adaptive Replanning Update">
            {replanNotice.msg}
          </MMAlert>
        </div>
      )}

      {/* Adaptive Rebalancing Quick Triggers */}
      <MMCard title="⚡ Quick Schedule Rebalancing">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <MMButton
            variant="outline"
            onClick={() => handleReplan('Missed study session', true)}
            disabled={isReplanning}
          >
            ⚠️ Missed a Session
          </MMButton>

          <MMButton
            variant="outline"
            onClick={() => handleReplan('Urgent deadline added', true)}
            disabled={isReplanning}
          >
            🔥 Urgent Deadline Added
          </MMButton>

          <MMButton
            variant="outline"
            onClick={() => handleReplan('Only 2 hours available today', true)}
            disabled={isReplanning}
          >
            ⏳ Change Available Hours
          </MMButton>

          <MMButton
            variant="primary"
            onClick={() => handleReplan('Manual schedule refresh', true)}
            disabled={isReplanning}
          >
            <RefreshCw size={14} className={isReplanning ? 'animate-spin' : ''} style={{ marginEnd: '6px' }} />
            Re-Plan Schedule Now
          </MMButton>
        </div>
      </MMCard>

      {/* Active Schedule Breakdown */}
      <div style={{ marginTop: '1.5rem' }}>
        <MMCard title={`📅 Active Study Plan (Version ${activePlan?.version || 1})`}>
          {activePlan?.scheduleBreakdown && activePlan.scheduleBreakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {activePlan.scheduleBreakdown.map((slot, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    borderRadius: '10px',
                    background: 'var(--bg-page)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {slot.assignmentTitle}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                      <span>🕒 {slot.startTime}</span>
                      <span>⏱️ {slot.durationMinutes} mins</span>
                      <span>📅 {slot.day}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--primary-color)', marginTop: '4px' }}>
                      💡 {slot.aiNote}
                    </div>
                  </div>

                  <MMBadge variant={slot.status === 'SCHEDULED' ? 'primary' : 'success'}>
                    {slot.status}
                  </MMBadge>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              No active study blocks scheduled. Create assignments to populate your plan.
            </p>
          )}
        </MMCard>
      </div>

    </div>
  );
};

export default StudyPlannerPage;
