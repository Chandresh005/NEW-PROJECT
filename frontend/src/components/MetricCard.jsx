import React from 'react';

/**
 * MetricCard component:
 * - White card, flat surface, thin border
 * - Muted label above in IBM Plex Sans
 * - Large color-coded number below (navy / forest green / brick red)
 * - No gradients, no heavy drop shadows
 */
const MetricCard = ({
  label,
  value,
  variant = 'navy',
  subtext,
  badge,
  icon: Icon,
  className = '',
}) => {
  // Map variant to text color
  let valueColor = 'text-compliscan-navy';
  let accentBorder = 'border-compliscan-border';

  if (variant === 'compliant' || variant === 'green') {
    valueColor = 'text-compliscan-compliant';
  } else if (variant === 'flagged' || variant === 'red') {
    valueColor = 'text-compliscan-flagged';
  } else if (variant === 'gold' || variant === 'warning') {
    valueColor = 'text-compliscan-gold';
  }

  return (
    <div
      className={`bg-compliscan-card border ${accentBorder} rounded-sm p-4 sm:p-5 transition-colors ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-compliscan-secondary text-xs font-semibold uppercase tracking-wider font-sans">
          {label}
        </span>
        {badge && (
          <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-sm bg-[#EFECE5] text-compliscan-secondary">
            {badge}
          </span>
        )}
        {Icon && (
          <Icon className="w-4 h-4 text-compliscan-secondary/60 flex-shrink-0" />
        )}
      </div>

      <div className="mt-2.5 flex items-baseline gap-2">
        <span
          className={`text-3xl sm:text-4xl font-semibold tracking-tight font-sans tabular-nums ${valueColor}`}
        >
          {value !== undefined && value !== null ? value : '—'}
        </span>
      </div>

      {subtext && (
        <div className="mt-2 text-xs text-compliscan-secondary font-sans flex items-center gap-1.5">
          {subtext}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
