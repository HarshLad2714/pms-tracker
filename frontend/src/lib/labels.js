export const STATUS = [
  { id: 'todo', label: 'To Do', mark: '01' },
  { id: 'in_progress', label: 'In Progress', mark: '02' },
  { id: 'in_review', label: 'In Review', mark: '03' },
  { id: 'qa', label: 'QA / Testing', mark: '04' },
  { id: 'done', label: 'Done', mark: '05' },
];

export const PRIORITY = {
  low: { label: 'Low', className: 'bg-ink-600 text-paper-100' },
  medium: { label: 'Medium', className: 'bg-brass/20 text-brass' },
  high: { label: 'High', className: 'bg-copper-500/20 text-copper-400' },
  urgent: { label: 'Urgent', className: 'bg-ember/20 text-ember' },
};

export const SEVERITY = {
  low: { label: 'Low', className: 'text-paper-200' },
  medium: { label: 'Medium', className: 'text-brass' },
  high: { label: 'High', className: 'text-copper-400' },
  critical: { label: 'Critical', className: 'text-ember' },
};

export const BUG_STATUS = ['open', 'in_progress', 'fixed', 'reopened', 'closed'];
export const PROJECT_STATUS = ['active', 'on_hold', 'completed', 'archived'];
export const TYPES = {
  task: { label: 'Task', mark: 'T', className: 'bg-brass/20 text-brass' },
  bug: { label: 'Bug', mark: 'B', className: 'bg-ember/20 text-ember' },
  story: { label: 'Story', mark: 'S', className: 'bg-copper-500/20 text-copper-400' },
};

export function pretty(value) {
  return String(value || '').replace(/_/g, ' ');
}

export function hours(minutes = 0) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return `${h}h ${m}m`;
}

export function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}
