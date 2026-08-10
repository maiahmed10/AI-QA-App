import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MMCard, MMButton, MMBadge, MMAlert } from '../sdk';
import shadowmateService from '../services/shadowmateService';
import { Plus, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

const AssignmentsPage = () => {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New assignment form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await shadowmateService.getAssignments();
      setAssignments(data);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await shadowmateService.createAssignment({
        title,
        description,
        dueDate: dueDate || new Date(Date.now() + 86400000 * 3).toISOString(),
        priority,
        estimatedMinutes: parseInt(estimatedMinutes)
      });
      setShowAddModal(false);
      setTitle('');
      setDescription('');
      fetchAssignments();
    } catch (err) {
      console.error('Create assignment error:', err);
    }
  };

  const handleToggleComplete = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await shadowmateService.updateAssignment(id, { status: newStatus });
      fetchAssignments();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>Loading Assignments...</p>
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
            margin: '0 0 6px 0'
          }}>
            📝 Assignments & Tasks
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>
            Manage course tasks and track estimated vs. actual study duration.
          </p>
        </div>

        <MMButton variant="primary" onClick={() => setShowAddModal(true)} style={{ gap: '8px' }}>
          <Plus size={16} /> Add Assignment
        </MMButton>
      </div>

      {/* Assignments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {assignments && assignments.length > 0 ? (
          assignments.map((item) => (
            <MMCard key={item.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <h3 style={{ fontSize: '18px', margin: 0, color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                    <MMBadge variant={item.priority === 'URGENT' ? 'danger' : item.priority === 'HIGH' ? 'warning' : 'primary'}>
                      {item.priority}
                    </MMBadge>
                    <MMBadge variant={item.status === 'COMPLETED' ? 'success' : 'outline'}>
                      {item.status}
                    </MMBadge>
                  </div>
                  {item.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 8px 0' }}>
                      {item.description}
                    </p>
                  )}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '16px' }}>
                    <span>⏱️ Estimated: {item.estimatedMinutes} mins</span>
                    <span>⌛ Actual Spent: {item.actualMinutesSpent || 0} mins</span>
                    <span>📅 Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <MMButton
                  variant={item.status === 'COMPLETED' ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => handleToggleComplete(item.id, item.status)}
                >
                  {item.status === 'COMPLETED' ? 'Mark Pending' : 'Mark Completed'}
                </MMButton>
              </div>
            </MMCard>
          ))
        ) : (
          <MMCard>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              No assignments found. Click "Add Assignment" to create your first task.
            </p>
          </MMCard>
        )}
      </div>

      {/* Modal to Add Assignment */}
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
            maxWidth: '500px',
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Add New Assignment</h3>
            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Neural Networks Lab #3"
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Details and requirements..."
                  style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Estimated Minutes
                  </label>
                  <input
                    type="number"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    style={{ width: '100%', padding: '8px', background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <MMButton variant="ghost" type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </MMButton>
                <MMButton variant="primary" type="submit">
                  Save Assignment
                </MMButton>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AssignmentsPage;
