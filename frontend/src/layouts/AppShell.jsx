import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Bug, CalendarDays, Flame, FolderKanban, LayoutDashboard, LogOut, Menu, Plus, Search, Settings2, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Avatar from '../components/Avatar';
import CommandPalette from '../components/CommandPalette';
import QuickCreate from '../components/QuickCreate';

const links = [
  { to: '/', label: 'Your work', icon: LayoutDashboard },
  { to: '/board', label: 'Board', icon: FolderKanban },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/bugs', label: 'Bugs', icon: Bug },
  { to: '/attendance', label: 'Timesheet', icon: CalendarDays },
  { to: '/reports', label: 'Reports', icon: Settings2 },
];

export default function AppShell() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [notes, setNotes] = useState({ notifications: [], unread: 0, open: false });

  async function loadNotes() {
    const { data } = await api.get('/notifications');
    setNotes((n) => ({ ...n, ...data }));
  }

  useEffect(() => {
    loadNotes();
    const t = setInterval(loadNotes, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter') {
        e.preventDefault();
        setCreateOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-ink-900 text-paper-50">
      <div className="pointer-events-none fixed inset-0 grain opacity-40" />
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 border-r border-ink-600 bg-ink-950/95 p-4 transition lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-copper-500 text-ink-950">
              <Flame size={18} />
            </span>
            <div>
              <p className="font-display text-xl leading-none">FORGE</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-paper-200/40">Workspace</p>
            </div>
          </button>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <button className="btn-copper mb-4 w-full" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Create
        </button>
        <nav className="space-y-1">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-ink-700 text-paper-50' : 'text-paper-200/70 hover:bg-ink-800 hover:text-paper-50'}`
                }
              >
                <Icon size={16} />
                {l.label}
              </NavLink>
            );
          })}
          {isAdmin && (
            <NavLink
              to="/people"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-ink-700 text-paper-50' : 'text-paper-200/70 hover:bg-ink-800 hover:text-paper-50'}`
              }
            >
              <Users size={16} />
              People
            </NavLink>
          )}
        </nav>
        <button onClick={() => navigate('/profile')} className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl border border-ink-600 bg-ink-800 p-3 text-left hover:border-brass/40">
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-[11px] uppercase tracking-wider text-brass">{user?.role}</p>
          </div>
        </button>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-ink-600/80 bg-ink-900/85 px-4 py-3 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <button className="field !w-auto min-w-0 flex-1 text-left text-paper-200/50" onClick={() => setPalette(true)}>
            <span className="inline-flex items-center gap-2">
              <Search size={14} /> Search issues, projects…
              <kbd className="ml-2 hidden rounded border border-ink-600 px-1.5 text-[10px] sm:inline">⌘K</kbd>
            </span>
          </button>
          <button className="btn-copper" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Create
          </button>
          <div className="relative">
            <button className="btn-ghost relative" onClick={() => setNotes((n) => ({ ...n, open: !n.open }))}>
              <Bell size={16} />
              {notes.unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-copper-500 px-1 text-[10px] text-ink-950">
                  {notes.unread}
                </span>
              )}
            </button>
            {notes.open && (
              <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-ink-600 bg-ink-800 shadow-stamp">
                <div className="flex items-center justify-between border-b border-ink-600 px-4 py-3">
                  <p className="text-sm">Notifications</p>
                  <button
                    className="text-xs text-brass"
                    onClick={async () => {
                      await api.patch('/notifications/read-all');
                      loadNotes();
                    }}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notes.notifications.length === 0 && <p className="p-4 text-sm text-paper-200/50">You are all caught up.</p>}
                  {notes.notifications.map((n) => (
                    <button
                      key={n._id}
                      className={`block w-full border-b border-ink-700 px-4 py-3 text-left ${n.read ? 'opacity-60' : ''}`}
                      onClick={async () => {
                        await api.patch(`/notifications/${n._id}/read`);
                        setNotes((s) => ({ ...s, open: false }));
                        if (n.link) navigate(n.link);
                        loadNotes();
                      }}
                    >
                      <p className="text-sm">{n.title}</p>
                      <p className="text-xs text-paper-200/50">{n.body}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            className="btn-ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            <LogOut size={16} />
          </button>
        </header>
        <main className="relative p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      {createOpen && <QuickCreate onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
