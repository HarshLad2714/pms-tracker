import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import Avatar from './Avatar';

export default function SearchSelect({
  options = [],
  value = [],
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search people…',
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const root = useRef(null);
  const searchRef = useRef(null);
  const selected = Array.isArray(value) ? value.map(String) : [];

  const picked = useMemo(
    () => selected.map((id) => options.find((o) => String(o.value) === id)).filter(Boolean),
    [options, selected]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((o) => [o.label, o.sub, o.search].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [options, q]);

  useEffect(() => {
    function onDoc(e) {
      if (root.current && !root.current.contains(e.target)) {
        setOpen(false);
        setQ('');
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        setQ('');
      }
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  function toggle(id) {
    const next = selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id];
    onChange(next);
  }

  return (
    <div ref={root} className="relative">
      <div
        role="button"
        tabIndex={0}
        className={`field flex min-h-[42px] cursor-pointer items-center justify-between gap-2 text-left ${open ? '!border-copper-500' : ''}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {picked.length === 0 && <span className="text-paper-200/40">{placeholder}</span>}
          {picked.map((o) => (
            <span key={o.value} className="inline-flex items-center gap-1 rounded-full bg-ink-700 px-2 py-0.5 text-xs">
              <span className="max-w-[8rem] truncate">{o.label}</span>
              <button
                type="button"
                className="text-paper-200/50 hover:text-paper-50"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(String(o.value));
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-paper-200/40 transition ${open ? 'rotate-180' : ''}`} />
      </div>

      {open && (
        <div className="absolute z-[80] mt-1 w-full overflow-hidden rounded-xl border border-ink-600 bg-ink-800 shadow-stamp">
          <div className="flex items-center gap-2 border-b border-ink-600 px-3 py-2">
            <Search size={14} className="text-paper-200/40" />
            <input
              ref={searchRef}
              className="w-full bg-transparent text-sm outline-none placeholder:text-paper-200/40"
              placeholder={searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && <p className="px-3 py-4 text-sm text-paper-200/50">No matches</p>}
            {filtered.map((o) => {
              const on = selected.includes(String(o.value));
              return (
                <button
                  key={o.value}
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-ink-700 ${on ? 'bg-ink-700/70' : ''}`}
                  onClick={() => toggle(String(o.value))}
                >
                  <span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${on ? 'border-copper-500 bg-copper-500 text-ink-950' : 'border-ink-500'}`}>
                    {on && <Check size={10} />}
                  </span>
                  {o.user && <Avatar user={o.user} size="sm" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{o.label}</span>
                    {o.sub && <span className="block truncate text-[11px] text-paper-200/45">{o.sub}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function peopleOptions(users = []) {
  return users.map((u) => ({
    value: u._id,
    label: u.name,
    sub: [u.role, u.department, u.email].filter(Boolean).join(' · '),
    search: `${u.name} ${u.email || ''} ${u.role || ''} ${u.department || ''}`,
    user: u,
  }));
}
