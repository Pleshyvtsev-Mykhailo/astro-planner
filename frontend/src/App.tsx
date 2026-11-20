import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './auth/RequireAuth';
import Layout from './components/Layout';
import JournalPage from './pages/JournalPage';
import LoginPage from './pages/LoginPage';
import NewObservationPage from './pages/NewObservationPage';
import NotFoundPage from './pages/NotFoundPage';
import ObjectDescriptionTab from './pages/ObjectDescriptionTab';
import ObjectPage from './pages/ObjectPage';
import ObjectsPage from './pages/ObjectsPage';
import ObservationPage from './pages/ObservationPage';
import VisibilityTab from './pages/VisibilityTab';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/objects" replace />} />
        <Route path="login" element={<LoginPage />} />

        {/* Каталог доступний усім */}
        <Route path="objects">
          <Route index element={<ObjectsPage />} />
          <Route path=":id" element={<ObjectPage />}>
            <Route index element={<ObjectDescriptionTab />} />
            <Route path="visibility" element={<VisibilityTab />} />
          </Route>
        </Route>

        {/* Журнал лише для тих, хто увійшов */}
        <Route element={<RequireAuth />}>
          <Route path="journal">
            <Route index element={<JournalPage />} />
            <Route path="new" element={<NewObservationPage />} />
            <Route path=":id" element={<ObservationPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}