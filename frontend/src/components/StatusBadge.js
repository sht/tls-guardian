// src/components/StatusBadge.js
import React from 'react';

function StatusBadge({ status }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS':
        return 'success';
      case 'WARN':
        return 'warning';
      case 'FAIL':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PASS':
        return 'PASS';
      case 'WARN':
        return 'WARN';
      case 'FAIL':
        return 'FAIL';
      default:
        return 'UNKNOWN';
    }
  };

  return (
    <span className={`badge bg-${getStatusColor(status)}`}>
      {getStatusText(status)}
    </span>
  );
}

export default StatusBadge;