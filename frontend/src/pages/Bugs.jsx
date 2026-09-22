import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { BUG_STATUS, SEVERITY, pretty } from '../lib/labels';
import DataTable from '../components/DataTable';

export default function Bugs() {
  const [bugs, setBugs] = useState([]);
  const [mine, setMine] = useState(true);
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');

  async function load() {
    const q = new URLSearchParams();
    if (mine) q.set('mine', 'true');
    const { data } = await api.get(`/bugs?${q.toString()}`);
    setBugs(data.bugs);
  }

  useEffect(() => {
    load();
  }, [mine]);

  const rows = useMemo(
    () =>
      bugs.filter((b) => {
        if (status && b.status !== status) return false;
        if (severity && b.severity !== severity) return false;
        return true;
      }),
    [bugs, status, severity]
  );

  const columns = [
    {
      key: 'title',
      header: 'Bug',
      render: (b) => (
        <Link to={`/tasks/${b.task?._id}`} className="hover:text-brass">
          {b.title}
        </Link>
      ),
    },
    { key: 'task', header: 'Task', exportValue: (b) => b.task?.title, render: (b) => b.task?.title || '—' },
    {
      key: 'severity',
      header: 'Severity',
      render: (b) => <span className={`uppercase tracking-wider ${SEVERITY[b.severity]?.className}`}>{b.severity}</span>,
    },
    { key: 'status', header: 'Status', exportValue: (b) => pretty(b.status), render: (b) => pretty(b.status) },
    { key: 'assigned', header: 'Assigned', exportValue: (b) => b.assignedTo?.name, render: (b) => b.assignedTo?.name || '—' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-copper-400">Assay</p>
        <h1 className="font-display text-4xl">Bugs</h1>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['title', 'severity', (b) => b.task?.title, (b) => b.assignedTo?.name, (b) => pretty(b.status)]}
        searchPlaceholder="Search bug, task, person…"
        filename="bugs"
        filters={
          <>
            <button type="button" className={mine ? 'btn-copper' : 'btn-ghost'} onClick={() => setMine((v) => !v)}>
              Assigned to me
            </button>
            <select className="field w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All status</option>
              {BUG_STATUS.map((s) => (
                <option key={s} value={s}>
                  {pretty(s)}
                </option>
              ))}
            </select>
            <select className="field w-40" value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="">All severity</option>
              {Object.keys(SEVERITY).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        }
      />
    </div>
  );
}
