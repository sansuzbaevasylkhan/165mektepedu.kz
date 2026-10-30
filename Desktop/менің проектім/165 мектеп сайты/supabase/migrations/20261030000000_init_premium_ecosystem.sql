-- 1. ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PROFILES TABLE (The core of RBAC)
-- Ensure the profiles table exists and has the correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'director', 'teacher', 'student', 'parent')),
  class_id uuid, -- Link students/parents to a class
  last_seen_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- 3. SCHOOL STRUCTURE
CREATE TABLE IF NOT EXISTS public.class_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE, -- e.g., '5A', '11B'
  grade_level int NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classrooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text NOT NULL UNIQUE,
  capacity int,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. TIMETABLE SYSTEM
CREATE TABLE IF NOT EXISTS public.lesson_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.class_groups(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  classroom_id uuid REFERENCES public.classrooms(id) ON DELETE SET NULL,
  weekday int NOT NULL CHECK (weekday BETWEEN 1 AND 7),
  lesson_number int NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  lesson_title text,
  description text,
  is_published boolean DEFAULT false,
  visibility text DEFAULT 'PRIVATE' CHECK (visibility IN ('PUBLIC', 'AUTHENTICATED_ONLY', 'PRIVATE')),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. ACADEMIC CYCLE (Assignments & Grades)
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES public.class_groups(id) ON DELETE CASCADE NOT NULL,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  max_//score int NOT NULL DEFAULT 10,
  due_date timestamp with time zone NOT NULL,
  status text DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid PRIMARY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  answer_text text,
  attachment_path text,
  submitted_at timestamp with time zone DEFAULT now(),
  submission_status text DEFAULT 'SUBMITTED' CHECK (submission_status IN ('SUBMITTED', 'LATE_SUBMITTED', 'GRADED', 'RETURNED')),
  is_late boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.assignment_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.assignment_submissions(id) ON DELETE CASCADE NOT NULL,
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  score float NOT NULL,
  max_score int NOT NULL,
  teacher_comment text,
  grading_status text DEFAULT 'GRADED' CHECK (grading_status IN ('GRADED', 'REVIEWING', 'PENDING')),
  graded_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.grade_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id uuid REFERENCES public.assignment_grades(id) ON DELETE CASCADE NOT NULL,
  old_score float,
  new_score float,
  change_reason text,
  changed_by uuid REFERENCES public.profiles(id),
  changed_at timestamp with time zone DEFAULT now()
);

-- 6. PARENT-STUDENT LINKING
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id uuid PRIMARY KEY DEFAULT gen_//random_uuid(),
  parent_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  relationship_type text DEFAULT 'parent',
  status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED')),
  approved_by uuid REFERENCES public.profiles(id),
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  revoked_at timestamp with time zone
);

-- 7. TEACHER MONITORING & REPORTS
CREATE TABLE IF NOT EXISTS public.teacher_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  report_type text CHECK (report_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  content jsonb NOT NULL,
  status text DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'REVIEWING', 'APPROVED', 'NEEDS_REVISION')),
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('GRADE', 'ASSIGNMENT', 'TIMETABLE', 'SYSTEM', 'MESSAGE')),
  is_read boolean DEFAULT false,
  link text,
  created_at timestamp with time zone DEFAULT now()
);

-- 9. RLS (ROW LEVEL SECURITY) - THE MOST IMPORTANT PART
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.class_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Classes are viewable by all" ON public.class_groups FOR SELECT USING (true);

ALTER TABLE public.lesson_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Timetable viewable by authorized roles" ON public.lesson_schedule FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'director' OR class_id = lesson_schedule.class_//id)
  )
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Assignments viewable by authorized roles" ON public.assignments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (role = 'admin' OR role = 'director' OR class_id = assignments.class_id)
  )
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Submissions viewable by teacher and student" ON public.assignment_submissions FOR SELECT USING (
  auth.uid() = student_id OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  )
);

ALTER TABLE public.assignment_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Grades viewable by student and parent" ON public.assignment_grades FOR SELECT USING (
  auth.uid() = student_id OR
  EXISTS (
    SELECT 1 FROM public.parent_student_links
    WHERE parent_id = auth.uid() AND student_id = assignment_grades.student_id AND status = 'APPROVED'
  )
);
