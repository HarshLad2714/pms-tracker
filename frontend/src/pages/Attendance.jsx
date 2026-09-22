import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { hours } from '../lib/labels';
import Avatar from '../components/Avatar';
import DataTable from '../components/DataTable';

export default function Attendance() {
  const { isLead } = useAuth();
  const [records, setRecords] = useState([]);
  const [today, setToday] = useState(null);
  const [from, setFrom] = useState(() => new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [flag, setFlag] = useState('');

  async function load() {
    const [{ data: t }, { data }] = await Promise.all([
      api.get('/attendance/today'),
      isLead ? api.get(`/attendance?from=${from}&to=${to}`) : api.get(`/attendance/me?from=${from}&to=${to}`),
    ]);
    setToday(t.attendance);
    setRecords(data.records);
  }

  useEffect(() => {
    load();
  }, [from, to, isLead]);

  const rows = useMemo(
    () =>
      records.filter((r) => {
        if (flag === 'late' && !r.isLate) return false;
        if (flag === 'early' && !r.isEarlyOut) return false;
        if (flag === 'open' && r.clockOut) return false;
        return true;
      }),
    [records, flag]
  );

  async function clock() {
    if (today?.clockIn && !today.clockOut) await api.post('/attendance/clock-out');
    else if (!today) await api.post('/attendance/clock-in');
    load();
  }

  const columns = [
    {
      key: 'person',
      header: 'Person',
      exportValue: (r) => r.user?.name || 'You',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Avatar user={r.user} size="sm" />
          {r.user?.name || 'You'}
        </div>
      ),
    },
    { key: 'date', header: 'Date' },
    {
      key: 'clockIn',
      header: 'In',
      exportValue: (r) => (r.clockIn ? format(new Date(r.clockIn), 'HH:mm') : ''),
      render: (r) => (r.clockIn ? format(new Date(r.clockIn), 'HH:mm') : '—'),
    },
    {
      key: 'clockOut',
      header: 'Out',
      exportValue: (r) => (r.clockOut ? format(new Date(r.clockOut), 'HH:mm') : ''),
      render: (r) => (r.clockOut ? format(new Date(r.clockOut), 'HH:mm') : '—'),
    },
    {
      key: 'hours',
      header: 'Hours',
      exportValue: (r) => hours(r.totalMinutes),
      render: (r) => hours(r.totalMinutes),
    },
    {
      key: 'flags',
      header: 'Flags',
      exportValue: (r) => [r.isLate ? 'late' : '', r.isEarlyOut ? 'early out' : ''].filter(Boolean).join('; '),
      render: (r) => (
        <span className="text-xs">
          {r.isLate && <span className="mr-2 text-copper-400">late</span>}
          {r.isEarlyOut && <span className="text-ember">early out</span>}
          {!r.isLate && !r.isEarlyOut && '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper-400">Hours</p>
          <h1 className="font-display text-4xl">Attendance</h1>
        </div>
        <button disabled={today?.clockOut} className={today?.clockIn && !today.clockOut ? 'btn-ghost' : 'btn-copper'} onClick={clock}>
          {today?.clockOut ? 'Day sealed' : today ? 'Clock out' : 'Clock in'}
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={['date', (r) => r.user?.name, (r) => r.user?.email, (r) => r.user?.department]}
        searchPlaceholder="Search person or date…"
        filename="attendance"
        filters={
          <>
            <input type="date" className="field w-40" value={from} onChange={(e) => setFrom(e.target.value)} />
            <input type="date" className="field w-40" value={to} onChange={(e) => setTo(e.target.value)} />
            <select className="field w-36" value={flag} onChange={(e) => setFlag(e.target.value)}>
              <option value="">All flags</option>
              <option value="late">late</option>
              <option value="early">early out</option>
              <option value="open">still in</option>
            </select>
          </>
        }
      />
    </div>
  );
}
