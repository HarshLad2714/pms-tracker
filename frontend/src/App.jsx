import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppShell from './layouts/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Board from './pages/Board';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import TaskDetail from './pages/TaskDetail';
import People from './pages/People';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Bugs from './pages/Bugs';

function Guard({ children, adminOnly }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-ink-900 text-paper-200">Heating…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Guard>
            <AppShell />
          </Guard>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="board" element={<Board />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="tasks/:id" element={<TaskDetail />} />
        <Route path="bugs" element={<Bugs />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="reports" element={<Reports />} />
        <Route
          path="people"
          element={
            <Guard adminOnly>
              <People />
            </Guard>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
