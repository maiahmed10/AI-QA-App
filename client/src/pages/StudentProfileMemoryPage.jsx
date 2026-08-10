import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MMCard, MMButton, MMInput, MMAlert, MMBadge } from '../sdk';
import shadowmateService from '../services/shadowmateService';
import { Brain, Edit3, Save, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

const StudentProfileMemoryPage = () => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form State for Manual Overrides
  const [preferredSessionDuration, setPreferredSessionDuration] = useState(45);
  const [dailyCapacityMinutes, setDailyCapacityMinutes] = useState(180);
  const [overridePaceRatio, setOverridePaceRatio] = useState(1.0);
  const [skillsText, setSkillsText] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [strengthsText, setStrengthsText] = useState('');
  const [weaknessesText, setWeaknessesText] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await shadowmateService.getProfile();
      setProfile(data);
      
      setPreferredSessionDuration(data.preferredSessionDuration || 45);
      setDailyCapacityMinutes(data.dailyStudyCapacityMinutes || 180);
      setOverridePaceRatio(data.manualOverrides?.overridePaceRatio || data.avgActualVsEstRatio || 1.0);
      setSkillsText((data.skills || []).join(', '));
      setInterestsText((data.interests || []).join(', '));
      setStrengthsText((data.subjectStrengths || []).join(', '));
      setWeaknessesText((data.subjectWeaknesses || []).join(', '));
    } catch (err) {
      console.error('Error loading memory profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const manualData = {
        preferredSessionDuration: parseInt(preferredSessionDuration),
        dailyStudyCapacityMinutes: parseInt(dailyCapacityMinutes),
        overridePaceRatio: parseFloat(overridePaceRatio),
        skills: skillsText.split(',').map(s => s.trim()).filter(Boolean),
        interests: interestsText.split(',').map(s => s.trim()).filter(Boolean),
        subjectStrengths: strengthsText.split(',').map(s => s.trim()).filter(Boolean),
        subjectWeaknesses: weaknessesText.split(',').map(s => s.trim()).filter(Boolean)
      };

      const res = await shadowmateService.updateManualProfile(manualData);
      setProfile(res.profile);
      setMessage({ type: 'success', text: 'Memory Profile updated! AI agents will use these manual overrides for future plans.' });
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to save profile memory' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Loading Memory Profile...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1000px', margin: '0 auto' }}>
      
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
          <Brain style={{ color: 'var(--primary-color)' }} />
          Transparent & Editable Student Memory
        </h1>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
          Inspect what ShadowMate has learned about your study habits. You can edit any parameter to calibrate future AI plans.
        </p>
      </div>

      {message && (
        <div style={{ marginBottom: '1.5rem' }}>
          <MMAlert type={message.type} title="Memory Profile Notice">
            {message.text}
          </MMAlert>
        </div>
      )}

      {/* Grid: AI Inferred Stats vs Editable Settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        
        {/* Left: AI Inferred Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <MMCard title="🔍 Inferred Insights">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pace Ratio (Actual vs Est)</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                  {Math.round((profile?.avgActualVsEstRatio || 1.0) * 100)}%
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Data Confidence Score</span>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--success-color)' }}>
                  {Math.round((profile?.dataConfidenceScore || 0.1) * 100)}%
                </div>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Peak Focus Hour</span>
                <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  ~{profile?.focusPattern?.peakFocusHour || 16}:00
                </div>
              </div>

              <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginEnd: '4px' }} />
                  Transparent System: Manual edits take priority over LLM inferences.
                </span>
              </div>

            </div>
          </MMCard>
        </div>

        {/* Right: Editable Form */}
        <MMCard title="✏️ Edit & Calibrate Memory Profile">
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '0.5rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Target Session Length (mins)
                </label>
                <input
                  type="number"
                  value={preferredSessionDuration}
                  onChange={(e) => setPreferredSessionDuration(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Daily Study Capacity (mins)
                </label>
                <input
                  type="number"
                  value={dailyCapacityMinutes}
                  onChange={(e) => setDailyCapacityMinutes(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Override Pace Multiplier (1.0 = normal, 0.8 = 20% faster, 1.2 = 20% extra time)
              </label>
              <input
                type="number"
                step="0.05"
                value={overridePaceRatio}
                onChange={(e) => setOverridePaceRatio(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Skills (Comma separated)
              </label>
              <input
                type="text"
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                placeholder="Python, Problem Solving, React, Calculus"
                style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Interests & Goals (Comma separated)
              </label>
              <input
                type="text"
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                placeholder="Artificial Intelligence, Web Development, Data Science"
                style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Subject Strengths
                </label>
                <input
                  type="text"
                  value={strengthsText}
                  onChange={(e) => setStrengthsText(e.target.value)}
                  placeholder="Math, Coding"
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Subject Weaknesses
                </label>
                <input
                  type="text"
                  value={weaknessesText}
                  onChange={(e) => setWeaknessesText(e.target.value)}
                  placeholder="History, Writing"
                  style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <MMButton variant="primary" type="submit" disabled={saving} style={{ gap: '8px' }}>
                <Save size={16} />
                {saving ? 'Saving Profile...' : 'Save Manual Overrides'}
              </MMButton>
            </div>

          </form>
        </MMCard>

      </div>

    </div>
  );
};

export default StudentProfileMemoryPage;
