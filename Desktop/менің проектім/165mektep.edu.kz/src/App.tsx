import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout, ScrollToTop } from './components/Layout';
import { CopyGuard } from './components/CopyGuard';
import { RequireAdmin, RequireAuth, RequireDirector, RequireStaff, RequireTeacher } from './components/RequireAuth';
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
const StudentAssignments = lazy(() => import('./pages/StudentAssignments'));
const Timetable = lazy(() => import('./pages/Timetable'));
const ParentAdmission = lazy(() => import('./pages/admission/ParentAdmission'));
const StaffAdmissions = lazy(() => import('./pages/admission/StaffAdmissions'));

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
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
const AdmissionsAdmin = lazy(() => import('./pages/admission/AdmissionsPage'));
const DocumentsCenter = lazy(() => import('./pages/admission/DocumentsCenter'));
const AdmissionAccess = lazy(() => import('./pages/admin/AdmissionAccess'));

const TeachersDashboard = lazy(() => import('./pages/admin/TeachersDashboard'));
const TeachersAdmin = lazy(() => import('./pages/admin/TeachersAdmin'));
const TeacherNew = lazy(() => import('./pages/admin/TeacherNew'));
const TeacherProfile = lazy(() => import('./pages/admin/TeacherProfile'));
const TasksAdmin = lazy(() => import('./pages/admin/TasksAdmin'));
const TeacherAudit = lazy(() => import('./pages/admin/TeacherAudit'));
const SubjectsAdmin = lazy(() => import('./pages/admin/SubjectsAdmin'));
const TeacherPanelLayout = lazy(() => import('./pages/teacher/TeacherPanelLayout'));
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'));
const MySubjects = lazy(() => import('./pages/teacher/MySubjects'));
const TeacherAssignments = lazy(() => import('./pages/teacher/TeacherAssignments'));
const TeacherAssignmentDetail = lazy(() => import('./pages/teacher/TeacherAssignmentDetail'));
const TeacherJournal = lazy(() => import('./pages/teacher/TeacherJournal'));
const TeacherMessages = lazy(() => import('./pages/teacher/TeacherMessages'));
const TeacherReports = lazy(() => import('./pages/teacher/TeacherReports'));
const TeacherTasks = lazy(() => import('./pages/teacher/TeacherTasks'));

const DirectorLogin = lazy(() => import('./pages/director/DirectorLogin'));
const DirectorLayout = lazy(() => import('./pages/director/DirectorLayout'));
const DirectorDashboard = lazy(() => import('./pages/director/DirectorDashboard'));
const DirectorTimetable = lazy(() => import('./pages/director/DirectorTimetable'));
const DirectorHistory = lazy(() => import('./pages/director/DirectorHistory'));
const AdminPermissions = lazy(() => import('./pages/director/AdminPermissions'));

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
            <Route path="cabinet/assignments" element={<RequireAuth><StudentAssignments /></RequireAuth>} />
            <Route path="cabinet/admission" element={<RequireAuth><ParentAdmission /></RequireAuth>} />
            <Route path="timetable" element={<RequireStaff><Timetable /></RequireStaff>} />
            <Route path="staff/admissions" element={<RequireStaff><StaffAdmissions /></RequireStaff>} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="teacher" element={<RequireTeacher><TeacherPanelLayout /></RequireTeacher>}>
            <Route index element={<TeacherDashboard />} />
            <Route path="subjects" element={<MySubjects />} />
            <Route path="assignments" element={<TeacherAssignments />} />
            <Route path="assignments/:id" element={<TeacherAssignmentDetail />} />
            <Route path="journal" element={<TeacherJournal />} />
            <Route path="messages" element={<TeacherMessages />} />
            <Route path="reports" element={<TeacherReports />} />
            <Route path="tasks" element={<TeacherTasks />} />
          </Route>

          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<TeachersDashboard />} />
            <Route path="teachers" element={<TeachersAdmin />} />
            <Route path="teachers/new" element={<TeacherNew />} />
            <Route path="teachers/:id" element={<TeacherProfile />} />
            <Route path="subjects" element={<SubjectsAdmin />} />
            <Route path="tasks" element={<TasksAdmin />} />
            <Route path="teacher-audit" element={<TeacherAudit />} />
            <Route path="students" element={<Navigate to="/admin/teachers" replace />} />
            <Route path="parents" element={<Navigate to="/admin/teachers" replace />} />
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
            <Route path="admissions" element={<AdmissionsAdmin />} />
            <Route path="documents" element={<DocumentsCenter />} />
            <Route path="admission-access" element={<AdmissionAccess />} />
            <Route path="users" element={<Navigate to="/admin/students" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          <Route path="direktor-admin/login" element={<DirectorLogin />} />
          <Route path="direktor-admin" element={<RequireDirector><DirectorLayout /></RequireDirector>}>
            <Route index element={<DirectorDashboard />} />
            <Route path="admissions" element={<AdmissionsAdmin />} />
            <Route path="documents" element={<DocumentsCenter />} />
            <Route path="timetable" element={<DirectorTimetable />} />
            <Route path="history" element={<DirectorHistory />} />
            <Route path="teachers" element={<TeachersAdmin />} />
            <Route path="teachers/new" element={<TeacherNew />} />
            <Route path="teachers/:id" element={<TeacherProfile />} />
            <Route path="academics" element={<SubjectsAdmin />} />
            <Route path="tasks" element={<TasksAdmin />} />
            <Route path="teacher-audit" element={<TeacherAudit />} />
            <Route path="admins" element={<AdminPermissions />} />
            <Route path="*" element={<Navigate to="/direktor-admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
