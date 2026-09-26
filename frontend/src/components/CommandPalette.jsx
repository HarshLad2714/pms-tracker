import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState({ tasks: [], projects: [], users: [] });

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (!q.trim()) {
        setHits({ tasks: [], projects: [], users: [] });
        return;
      }
      const { data } = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setHits(data);
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  function go(path) {
    onClose();
    setQ('');
    navigate(path);
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-start bg-ink-950/70 px-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div className="panel w-full max-w-2xl shadow-stamp" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="field rounded-none border-0 border-b border-ink-600"
          placeholder="Search issues, projects, people…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="max-h-96 overflow-y-auto p-2">
          {!q && <p className="px-3 py-6 text-sm text-paper-200/50">Type to search. Shortcut ⌘K / Ctrl+K</p>}
          {hits.tasks.map((t) => (
            <button key={t._id} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-ink-700" onClick={() => go(`/tasks/${t._id}`)}>
              <span>
                <span className="mr-2 text-xs text-brass">{t.key || 'FRG'}</span>
                {t.title}
              </span>
              <span className="text-xs text-paper-200/40">{t.project?.name}</span>
            </button>
          ))}
          {hits.projects.map((p) => (
            <button key={p._id} className="flex w-full rounded-xl px-3 py-2 text-left hover:bg-ink-700" onClick={() => go(`/projects/${p._id}`)}>
              Project · {p.name}
            </button>
          ))}
          {hits.users.map((u) => (
            <div key={u._id} className="rounded-xl px-3 py-2 text-sm text-paper-200/70">
              People · {u.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
