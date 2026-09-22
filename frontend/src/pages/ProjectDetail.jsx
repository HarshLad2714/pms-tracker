import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { pretty, PRIORITY, STATUS } from '../lib/labels';
import Avatar from '../components/Avatar';
import { ProjectForm } from './Projects';
import DataTable from '../components/DataTable';

export default function ProjectDetail() {
  const { id } = useParams();
  const { isLead } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [edit, setEdit] = useState(false);
  const [taskStatus, setTaskStatus] = useState('');
  const [taskPriority, setTaskPriority] = useState('');

  async function load() {
    const [{ data: p }, { data: t }, { data: u }] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks?project=${id}`),
      api.get('/users?active=true'),
    ]);
    setProject(p.project);
    setTasks(t.tasks);
    setUsers(u.users);
  }

  useEffect(() => {
    load();
  }, [id]);

  const visibleTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (taskStatus && t.status !== taskStatus) return false;
        if (taskPriority && t.priority !== taskPriority) return false;
        return true;
      }),
    [tasks, taskStatus, taskPriority]
  );

  if (!project) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-copper-400">{pretty(project.status)}</p>
          <h1 className="font-display text-4xl">{project.name}</h1>
          <p className="mt-2 max-w-2xl text-paper-200/60">{project.description}</p>
        </div>
        {isLead && (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setEdit(true)}>
              Edit
            </button>
            <button
              className="btn-ghost"
              onClick={async () => {
                await api.patch(`/projects/${id}/archive`);
                load();
              }}
            >
              Archive
            </button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel p-4">
          <p className="label">Deadline</p>
          <p>{project.deadline ? format(new Date(project.deadline), 'dd MMM yyyy') : 'Open'}</p>
        </div>
        <div className="panel p-4">
          <p className="label">Tasks</p>
          <p>{tasks.length}</p>
        </div>
        <div className="panel p-4">
          <p className="label">Crew</p>
          <div className="mt-1 flex -space-x-2">
            {project.members.map((m) => (
              <Avatar key={m._id} user={m} size="sm" />
            ))}
          </div>
        </div>
      </div>

      <DataTable
        columns={[
          {
            key: 'title',
            header: 'Task',
            render: (t) => (
              <Link to={`/tasks/${t._id}`} className="hover:text-brass">
                {t.title}
              </Link>
            ),
          },
          { key: 'status', header: 'Status', exportValue: (t) => pretty(t.status), render: (t) => pretty(t.status) },
          {
            key: 'priority',
            header: 'Priority',
            render: (t) => <span className={`chip ${PRIORITY[t.priority]?.className}`}>{t.priority}</span>,
          },
          {
            key: 'assignees',
            header: 'Assignees',
            exportValue: (t) => (t.assignees || []).map((a) => a.name).join('; '),
            render: (t) => (
              <div className="flex -space-x-2">
                {t.assignees.map((a) => (
                  <Avatar key={a._id} user={a} size="sm" />
                ))}
              </div>
            ),
          },
          {
            key: 'dueDate',
            header: 'Due',
            exportValue: (t) => (t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : ''),
            render: (t) => (t.dueDate ? format(new Date(t.dueDate), 'dd MMM yyyy') : '—'),
          },
        ]}
        rows={visibleTasks}
        searchKeys={['title', 'priority', (t) => pretty(t.status), (t) => (t.assignees || []).map((a) => a.name).join(' ')]}
        searchPlaceholder="Search tasks…"
        filename={`${project.name}-tasks`}
        filters={
          <>
            <select className="field w-40" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}>
              <option value="">All status</option>
              {STATUS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select className="field w-36" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
              <option value="">All heat</option>
              {Object.keys(PRIORITY).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </>
        }
      />

      {edit && (
        <ProjectForm
          users={users}
          initial={project}
          onClose={() => setEdit(false)}
          onSaved={() => {
            setEdit(false);
            load();
          }}
        />
      )}
    </div>
  );
}
