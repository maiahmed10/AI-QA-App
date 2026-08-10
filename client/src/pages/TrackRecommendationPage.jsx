import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MMCard, MMButton, MMBadge, MMAlert } from '../sdk';
import shadowmateService from '../services/shadowmateService';
import { GraduationCap, Award, Brain, AlertTriangle, CheckCircle2, RefreshCw, ChevronRight } from 'lucide-react';

const TrackRecommendationPage = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await shadowmateService.getTrackRecommendations();
      setData(res);
    } catch (err) {
      console.error('Error fetching track recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Evaluating Skills, Mastery & Learning Pace for Academic Tracks...</p>
      </div>
    );
  }

  const { isInsufficientData, recommendations, confidenceScore } = data || {};

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
          <GraduationCap style={{ color: 'var(--primary-color)' }} />
          Academic & Career Track Recommendation Engine
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
          Evaluates your skills, study pace, performance, and interests using deterministic scoring + explainable AI.
        </p>
      </div>

      {/* Insufficient Data Banner */}
      {isInsufficientData && (
        <div style={{ marginBottom: '1.5rem' }}>
          <MMAlert type="warning" title="⚠️ Insufficient Data State">
            ShadowMate requires more study sessions and completed task data to make a highly confident track recommendation. Log at least 3-5 study sessions to unlock high-confidence evidence scoring.
          </MMAlert>
        </div>
      )}

      {/* Recommendations List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {recommendations && recommendations.length > 0 ? (
          recommendations.map((item, idx) => (
            <MMCard key={item.trackId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '20px', margin: 0, color: 'var(--text-primary)' }}>
                      #{idx + 1} {item.trackName}
                    </h3>
                    <MMBadge variant={idx === 0 ? 'success' : 'primary'}>
                      {item.fitPercentage}% Fit
                    </MMBadge>
                    <MMBadge variant="outline">
                      {item.confidenceLevel} CONFIDENCE
                    </MMBadge>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 1rem 0' }}>
                    {item.description}
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(224,170,62,0.15) 0%, rgba(224,170,62,0.05) 100%)',
                  border: '1px solid var(--primary-color)',
                  borderRadius: '12px',
                  padding: '1rem 1.5rem',
                  textAlign: 'center',
                  minWidth: '120px'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    {item.fitPercentage}%
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Match Score</div>
                </div>

              </div>

              {/* Deterministic Factor Score Breakdown */}
              {item.deterministicScores && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '1rem',
                  margin: '1.25rem 0',
                  padding: '1rem',
                  borderRadius: '10px',
                  background: 'var(--bg-page)',
                  border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Skills Match</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {item.deterministicScores.skillsMatch}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Academic Focus</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {item.deterministicScores.academicPerformance}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pace Efficiency</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {item.deterministicScores.paceEfficiency}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Interests Alignment</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {item.deterministicScores.interestsAlignment}%
                    </div>
                  </div>
                </div>
              )}

              {/* Explainable Reasoning Bullets */}
              <div>
                <h4 style={{ fontSize: '14px', margin: '0 0 8px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Brain size={16} style={{ color: 'var(--primary-color)' }} />
                  Explainable Evidence & Reasoning:
                </h4>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {item.reasoning.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </MMCard>
          ))
        ) : (
          <MMCard>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              No academic tracks available yet. Ask your administrator to seed tracks in the catalog.
            </p>
          </MMCard>
        )}
      </div>

    </div>
  );
};

export default TrackRecommendationPage;
