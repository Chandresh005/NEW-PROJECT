import React from 'react';

/**
 * StatusPill component adhering to government data-serious guidelines:
 * - Pale background + dark text from the same color family
 * - Never plain black text on color
 * - Thin border, subtle dot indicator, accessible contrast
 */
const StatusPill = ({ status, size = 'sm', showDot = true, className = '' }) => {
  const normStatus = (status || '').toLowerCase().trim();

  let config = {
    label: 'Review',
    bgClass: 'bg-compliscan-review-bg',
    textClass: 'text-compliscan-review-text',
    borderClass: 'border-compliscan-review-border',
    dotClass: 'bg-compliscan-review',
  };

  if (normStatus === 'compliant' || normStatus === 'pass' || normStatus === 'approved') {
    config = {
      label: 'Compliant',
      bgClass: 'bg-compliscan-compliant-bg',
      textClass: 'text-compliscan-compliant-text',
      borderClass: 'border-compliscan-compliant-border',
      dotClass: 'bg-compliscan-compliant',
    };
  } else if (
    normStatus === 'flagged' ||
    normStatus === 'non_compliant' ||
    normStatus === 'non-compliant' ||
    normStatus === 'fail' ||
    normStatus === 'violation'
  ) {
    config = {
      label: 'Flagged',
      bgClass: 'bg-compliscan-flagged-bg',
      textClass: 'text-compliscan-flagged-text',
      borderClass: 'border-compliscan-flagged-border',
      dotClass: 'bg-compliscan-flagged',
    };
  } else if (
    normStatus === 'review' ||
    normStatus === 'review_required' ||
    normStatus === 'partially_compliant' ||
    normStatus === 'partial' ||
    normStatus === 'warning'
  ) {
    config = {
      label: normStatus.includes('partial') ? 'Review' : 'Review',
      bgClass: 'bg-compliscan-review-bg',
      textClass: 'text-compliscan-review-text',
      borderClass: 'border-compliscan-review-border',
      dotClass: 'bg-compliscan-review',
    };
  } else {
    // Default fallback to subtle neutral tone
    config = {
      label: status || 'Pending',
      bgClass: 'bg-[#EDEAE3]',
      textClass: 'text-compliscan-secondary',
      borderClass: 'border-[#DBD6CB]',
      dotClass: 'bg-compliscan-secondary',
    };
  }

  const sizeClasses = size === 'sm' 
    ? 'text-xs px-2 py-0.5' 
    : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans font-medium rounded-sm border ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${config.dotClass}`}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusPill;
