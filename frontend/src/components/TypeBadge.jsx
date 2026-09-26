import { TYPES } from '../lib/labels';

export default function TypeBadge({ type = 'task' }) {
  const meta = TYPES[type] || TYPES.task;
  return <span className={`chip ${meta.className}`}>{meta.label}</span>;
}
