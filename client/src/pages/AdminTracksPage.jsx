import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MMCard, MMButton, MMBadge, MMAlert } from '../sdk';
import shadowmateService from '../services/shadowmateService';
import { GraduationCap, Plus, BookOpen, Layers, RefreshCw } from 'lucide-react';

const AdminTracksPage = () => {
  const { t } = useTranslation();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [trackName, setTrackName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [outcomesText, setOutcomesText] = useState('');

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const data = await shadowmateService.getAdminTracks();
      setTracks(data);
    } catch (err) {
      console.error('Error fetching admin tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrack = async (e) => {
    e.preventDefault();
    try {
      await shadowmateService.createAdminTrack({
        trackName,
        code,
        description,
        requiredSkills: skillsText.split(',').map(s => s.trim()).filter(Boolean),
        careerOutcomes: outcomesText.split(',').map(s => s.trim()).filter(Boolean)
      });
      setShowAddModal(false);
      setTrackName('');
      setCode('');
      setDescription('');
      fetchTracks();
    } catch (err) {
      console.error('Create track error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Loading Academic Catalog...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
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
            <GraduationCap style={{ color: 'var(--primary-color)' }} />
            Academic Track & Course Catalog (Admin)
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
            Manage academic tracks, required skills, and course definitions for the ShadowMate engine.
          </p>
        </div>

        <MMButton variant="primary" onClick={() => setShowAddModal(true)} style={{ gap: '8px' }}>
          <Plus size={16} /> Create Academic Track
        </MMButton>
      </div>

      {/* Tracks List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {tracks && tracks.length > 0 ? (
          tracks.map((track) => (
            <MMCard key={track.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>
                      {track.trackName}
                    </h3>
                    <MMBadge variant="primary">{track.code}</MMBadge>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 1rem 0' }}>
                    {track.description}
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '12px' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Required Skills: </strong>
                      <span style={{ color: 'var(--text-muted)' }}>{(track.requiredSkills || []).join(', ') || 'None specified'}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>Career Outcomes: </strong>
                      <span style={{ color: 'var(--text-muted)' }}>{(track.careerOutcomes || []).join(', ') || 'None specified'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </MMCard>
          ))
        ) : (
          <MMCard>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              No academic tracks configured in catalog yet.
            </p>
          </MMCard>
        )}
      </div>

      {/* Create Track Modal */}
      {showAddModal && (
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
            maxWidth: '520px',
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Create New Academic Track</h3>
            <form onSubmit={handleCreateTrack} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Track Name
                  </label>
                  <input
                    type="text"
                    required
                    value={trackName}
                    onChange={(e) => setTrackName(e.target.value)}
                    placeholder="e.g. Data Science & Analytics"
                    style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Code
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="DATA_SCI"
                    style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Required Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="Python, Statistics, SQL, Data Mining"
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Career Outcomes (Comma separated)
                </label>
                <input
                  type="text"
                  value={outcomesText}
                  onChange={(e) => setOutcomesText(e.target.value)}
                  placeholder="Data Analyst, ML Engineer, BI Developer"
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <MMButton variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </MMButton>
                <MMButton variant="primary" type="submit">
                  Save Track
                </MMButton>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminTracksPage;
