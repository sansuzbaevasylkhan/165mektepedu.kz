import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout, ScrollToTop } from './components/Layout';
import { CopyGuard } from './components/CopyGuard';
import { RequireAdmin, RequireAuth, RequireDirector, RequireStaff } from './components/RequireAuth';
import { Spinner } from './components/ui';
import Home from './pages/Home';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import { Privacy, Terms } from './pages/Legal';
import NotFound from './pages/NotFound';

// Ауыр бөлімдер қажет болғанда ғана жүктеледі (жылдам ашылу үшін)
const Ubt = lazy(() => import('./pages/Ubt'));
const UbtSubject = lazy(() => import('./pages/UbtSubject'));
const Lesson = lazy(() => import('./pages/Lesson'));
const Cabinet = lazy(() => import('./pages/Cabinet'));
const Timetable = lazy(() => import('./pages/Timetable'));

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const StudentsAdmin = lazy(() => import('./pages/admin/StudentsAdmin'));
const ParentsAdmin = lazy(() => import('./pages/admin/ParentsAdmin'));
const NewsAdmin = lazy(() => import('./pages/admin/NewsAdmin'));
const AboutAdmin = lazy(() => import('./pages/admin/AboutAdmin'));
const GalleryAdmin = lazy(() => import('./pages/admin/GalleryAdmin'));
const UbtAdmin = lazy(() => import('./pages/admin/UbtAdmin'));
const ProgressAdmin = lazy(() => import('./pages/admin/ProgressAdmin'));
const StatsAdmin = lazy(() => import('./pages/admin/StatsAdmin'));
const LogsAdmin = lazy(() => import('./pages/admin/LogsAdmin'));
const HomeAdmin = lazy(() => import('./pages/admin/HomeAdmin'));
const FooterAdmin = lazy(() => import('./pages/admin/FooterAdmin'));
const SocialAdmin = lazy(() => import('./pages/admin/SocialAdmin'));
const AppsAdmin = lazy(() => import('./pages/admin/AppsAdmin'));
const SiteAdmin = lazy(() => import('./pages/admin/SiteAdmin'));
const SecurityAdmin = lazy(() => import('./pages/admin/SecurityAdmin'));
const TimetableAdmin = lazy(() => import('./pages/admin/TimetableAdmin'));

const DirectorLogin = lazy(() => import('./pages/director/DirectorLogin'));
const DirectorLayout = lazy(() => import('./pages/director/DirectorLayout'));
const DirectorTimetable = lazy(() => import('./pages/director/DirectorTimetable'));
const DirectorHistory = lazy(() => import('./pages/director/DirectorHistory'));

export default function App() {
  return (
    <>
      <CopyGuard />
      <ScrollToTop />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="news" element={<News />} />
            <Route path="news/:id" element={<NewsDetail />} />
            <Route path="about" element={<About />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="terms" element={<Terms />} />
            <Route path="ubt" element={<RequireAuth><Ubt /></RequireAuth>} />
            <Route path="ubt/lesson/:lessonId" element={<RequireAuth><Lesson /></RequireAuth>} />
            <Route path="ubt/:subjectId" element={<RequireAuth><UbtSubject /></RequireAuth>} />
            <Route path="cabinet" element={<RequireAuth><Cabinet /></RequireAuth>} />
            <Route path="timetable" element={<RequireStaff><Timetable /></RequireStaff>} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<StudentsAdmin />} />
            <Route path="parents" element={<ParentsAdmin />} />
            <Route path="news" element={<NewsAdmin />} />
            <Route path="about" element={<AboutAdmin />} />
            <Route path="gallery" element={<GalleryAdmin />} />
            <Route path="ubt" element={<Navigate to="/admin/ubt/subjects" replace />} />
            <Route path="ubt/subjects" element={<UbtAdmin initialTab="subjects" />} />
            <Route path="ubt/lessons" element={<UbtAdmin initialTab="lessons" />} />
            <Route path="ubt/tests" element={<UbtAdmin initialTab="tests" />} />
            <Route path="progress" element={<ProgressAdmin />} />
            <Route path="stats" element={<StatsAdmin />} />
            <Route path="logs" element={<LogsAdmin />} />
            <Route path="home" element={<HomeAdmin />} />
            <Route path="footer" element={<FooterAdmin />} />
            <Route path="social" element={<SocialAdmin />} />
            <Route path="apps" element={<AppsAdmin />} />
            <Route path="site" element={<SiteAdmin />} />
            <Route path="security" element={<SecurityAdmin />} />
            <Route path="timetable" element={<TimetableAdmin />} />
            <Route path="users" element={<Navigate to="/admin/students" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          <Route path="direktor-admin/login" element={<DirectorLogin />} />
          <Route path="direktor-admin" element={<RequireDirector><DirectorLayout /></RequireDirector>}>
            <Route index element={<DirectorTimetable />} />
            <Route path="history" element={<DirectorHistory />} />
            <Route path="*" element={<Navigate to="/direktor-admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
