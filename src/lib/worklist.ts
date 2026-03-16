export const formatLabel = (value?: string) => (value || '').replace(/_/g, ' ');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const getDaysUntilDate = (value: string) => {
  const targetDate = new Date(value);
  targetDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.round((targetDate.getTime() - today.getTime()) / MS_PER_DAY);
};

export const getSortTimestamp = (primary?: string, fallback?: string) => {
  const primaryTime = primary ? new Date(primary).getTime() : Number.NaN;

  if (Number.isFinite(primaryTime)) {
    return primaryTime;
  }

  const fallbackTime = fallback ? new Date(fallback).getTime() : Number.NaN;
  return Number.isFinite(fallbackTime) ? fallbackTime : 0;
};

interface TimingMetaOptions {
  closed?: boolean;
  pastLabel?: string;
  todayLabel?: string;
  tomorrowLabel?: string;
}

export const getTimingMeta = (value: string, options?: TimingMetaOptions) => {
  const daysUntil = getDaysUntilDate(value);
  const closed = options?.closed || false;

  if (!closed && daysUntil < 0) {
    return {
      label: options?.pastLabel || 'Past event',
      className: 'border-red-200 bg-red-50 text-red-700',
      daysUntil,
    };
  }

  if (daysUntil === 0) {
    return {
      label: options?.todayLabel || 'Today',
      className: 'border-amber-200 bg-amber-50 text-amber-900',
      daysUntil,
    };
  }

  if (daysUntil === 1) {
    return {
      label: options?.tomorrowLabel || 'Tomorrow',
      className: 'border-amber-200 bg-amber-50 text-amber-900',
      daysUntil,
    };
  }

  if (daysUntil > 1 && daysUntil <= 7) {
    return {
      label: `In ${daysUntil} days`,
      className: 'border-blue-200 bg-blue-50 text-blue-800',
      daysUntil,
    };
  }

  if (daysUntil < 0) {
    return {
      label: `${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} ago`,
      className: 'border-slate-200 bg-slate-50 text-slate-700',
      daysUntil,
    };
  }

  return {
    label: `In ${daysUntil} days`,
    className: 'border-slate-200 bg-slate-50 text-slate-700',
    daysUntil,
  };
};
