import React from 'react';
import { Clock, Eye, Wrench, CheckCircle, XCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'Pending':
        return {
          color: 'var(--status-pending)',
          bg: 'var(--status-pending-bg)',
          icon: <Clock size={13} />,
          label: 'Pending'
        };
      case 'Under Review':
        return {
          color: 'var(--status-review)',
          bg: 'var(--status-review-bg)',
          icon: <Eye size={13} />,
          label: 'Under Review'
        };
      case 'In Progress':
        return {
          color: 'var(--status-progress)',
          bg: 'var(--status-progress-bg)',
          icon: <Wrench size={13} />,
          label: 'In Progress'
        };
      case 'Resolved':
        return {
          color: 'var(--status-resolved)',
          bg: 'var(--status-resolved-bg)',
          icon: <CheckCircle size={13} />,
          label: 'Resolved'
        };
      case 'Rejected':
        return {
          color: 'var(--status-rejected)',
          bg: 'var(--status-rejected-bg)',
          icon: <XCircle size={13} />,
          label: 'Rejected'
        };
      default:
        return {
          color: 'var(--text-muted)',
          bg: '#f1f5f9',
          icon: null,
          label: status
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: '600',
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}25`,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap'
      }}
    >
      {config.icon}
      {config.label}
    </span>
  );
};

export default StatusBadge;
