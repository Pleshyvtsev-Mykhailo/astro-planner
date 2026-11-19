import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './auth/RequireAuth';
import Layout from './components/Layout';
import JournalPage from './pages/JournalPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import ObjectsPage from './pages/ObjectsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/objects" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="objects" element={<ObjectsPage />} />

        {}
        <Route element={<RequireAuth />}>
          <Route path="journal" element={<JournalPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}