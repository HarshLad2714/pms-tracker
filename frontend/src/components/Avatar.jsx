import { initials } from '../lib/labels';

export default function Avatar({ user, size = 'md' }) {
  const dim = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-12 w-12 text-sm' : 'h-9 w-9 text-xs';
  if (!user) return <span className={`${dim} grid place-items-center rounded-full bg-ink-600 text-paper-200`}>—</span>;
  if (user.avatar) {
    return <img src={user.avatar} alt={user.name} className={`${dim} rounded-full object-cover`} />;
  }
  return (
    <span className={`${dim} grid place-items-center rounded-full bg-copper-500/20 font-semibold text-copper-400`}>
      {initials(user.name)}
    </span>
  );
}
