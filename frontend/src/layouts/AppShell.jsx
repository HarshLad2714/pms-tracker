import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Flame, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Avatar from '../components/Avatar';

const links = [
  { to: '/', label: 'Studio' },
  { to: '/board', label: 'Board' },
  { to: '/projects', label: 'Projects' },
  { to: '/bugs', label: 'Bugs' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/reports', label: 'Reports' },
];

export default function AppShell() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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

  return (
    <div className="min-h-screen bg-ink-900 text-paper-50">
      <div className="pointer-events-none fixed inset-0 grain opacity-40" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-gradient-to-b from-copper-500/10 to-transparent" />

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-ink-600 bg-ink-950/95 p-5 transition lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-copper-500 text-ink-950">
              <Flame size={18} />
            </span>
            <span className="font-display text-2xl tracking-tight">FORGE</span>
          </button>
          <button className="lg:hidden" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2.5 text-sm tracking-wide ${isActive ? 'bg-ink-700 text-paper-50' : 'text-paper-200/70 hover:bg-ink-800 hover:text-paper-50'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/people"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block rounded-xl px-3 py-2.5 text-sm tracking-wide ${isActive ? 'bg-ink-700 text-paper-50' : 'text-paper-200/70 hover:bg-ink-800 hover:text-paper-50'}`
              }
            >
              People
            </NavLink>
          )}
        </nav>
        <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-ink-600 bg-ink-800 p-3">
          <div className="flex items-center gap-3">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-[11px] uppercase tracking-wider text-brass">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-600/80 bg-ink-900/80 px-4 py-3 backdrop-blur">
          <button className="lg:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <p className="hidden text-xs uppercase tracking-[0.25em] text-paper-200/50 sm:block">Work, welded together</p>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button
                className="btn-ghost relative"
                onClick={() => setNotes((n) => ({ ...n, open: !n.open }))}
              >
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
                    <p className="text-sm">Signals</p>
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
                    {notes.notifications.length === 0 && <p className="p-4 text-sm text-paper-200/50">Quiet shop floor.</p>}
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
              Out
            </button>
          </div>
        </header>
        <main className="relative p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
