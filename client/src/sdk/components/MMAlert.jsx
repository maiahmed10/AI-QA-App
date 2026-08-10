import React from 'react';

const MMAlert = ({ type = 'info', title, children, style = {} }) => {
  let bg = 'rgba(224, 170, 62, 0.12)';
  let border = 'var(--primary-color)';
  let color = 'var(--text-primary)';

  if (type === 'success') {
    bg = 'rgba(16, 185, 129, 0.12)';
    border = 'var(--success-color, #10B981)';
  } else if (type === 'danger' || type === 'error') {
    bg = 'rgba(239, 68, 68, 0.12)';
    border = 'var(--danger-color, #EF4444)';
  } else if (type === 'warning') {
    bg = 'rgba(245, 158, 11, 0.12)';
    border = 'var(--warning-color, #F59E0B)';
  }

  return (
    <div style={{
      padding: '1rem 1.25rem',
      borderRadius: '10px',
      background: bg,
      border: `1px solid ${border}`,
      color,
      ...style
    }}>
      {title && (
        <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>
          {title}
        </div>
      )}
      <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
        {children}
      </div>
    </div>
  );
};

export default MMAlert;
