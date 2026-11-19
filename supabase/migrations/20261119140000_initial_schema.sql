create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  university text check (university is null or char_length(university) <= 160),
  department text check (department is null or char_length(department) <= 160),
  course_of_study text check (course_of_study is null or char_length(course_of_study) <= 160),
  academic_level text check (academic_level is null or char_length(academic_level) <= 80),
  semester text check (semester is null or char_length(semester) <= 80),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  preferred_study_hours smallint not null default 2 check (preferred_study_hours between 1 and 16),
  main_goals text[] not null default '{}',
  preferred_currency varchar(3) not null default 'USD' check (preferred_currency ~ '^[A-Z]{3}$'),
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  timezone text not null default 'UTC',
  date_format text not null default 'MMM d, yyyy',
  week_starts_on smallint not null default 1 check (week_starts_on between 0 and 6),
  notification_preferences jsonb not null default '{"assignments":true,"exams":true,"habits":true,"budgets":true}'::jsonb
    check (jsonb_typeof(notification_preferences) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  course_code text check (course_code is null or char_length(course_code) <= 40),
  department text,
  instructor text,
  credit_units numeric(4,1) check (credit_units is null or credit_units between 0 and 30),
  semester text,
  academic_year text,
  color text not null default 'violet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid,
  title text not null check (char_length(title) between 1 and 240),
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed', 'cancelled')),
  priority smallint not null default 2 check (priority between 1 and 4),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (course_id, user_id) references public.courses(id, user_id) on delete cascade
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  event_type text not null default 'personal' check (event_type in ('lecture', 'study', 'personal', 'appointment', 'deadline')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  recurrence_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at),
  foreign key (course_id, user_id) references public.courses(id, user_id) on delete cascade
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null,
  title text not null check (char_length(title) between 1 and 200),
  description text,
  due_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'submitted', 'graded')),
  points_possible numeric(8,2) check (points_possible is null or points_possible >= 0),
  points_earned numeric(8,2) check (points_earned is null or points_earned >= 0),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (course_id, user_id) references public.courses(id, user_id) on delete cascade
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null,
  title text not null check (char_length(title) between 1 and 200),
  exam_type text not null default 'exam' check (exam_type in ('exam', 'quiz', 'midterm', 'final', 'other')),
  starts_at timestamptz not null,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (course_id, user_id) references public.courses(id, user_id) on delete cascade
);

create table public.grade_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid,
  assignment_id uuid,
  exam_id uuid,
  assessment_name text not null check (char_length(assessment_name) between 1 and 200),
  score numeric(8,2) not null check (score >= 0),
  maximum_score numeric(8,2) not null check (maximum_score > 0),
  weight numeric(6,3) check (weight is null or weight between 0 and 100),
  assessed_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (course_id, user_id) references public.courses(id, user_id) on delete cascade,
  foreign key (assignment_id, user_id) references public.assignments(id, user_id) on delete cascade,
  foreign key (exam_id, user_id) references public.exams(id, user_id) on delete cascade
);

create table public.grading_scales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scale_name text not null check (char_length(scale_name) between 1 and 100),
  letter_grade text not null check (char_length(letter_grade) between 1 and 8),
  minimum_percent numeric(5,2) not null check (minimum_percent between 0 and 100),
  maximum_percent numeric(5,2) not null check (maximum_percent between 0 and 100),
  grade_point numeric(4,2) not null check (grade_point >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (maximum_percent >= minimum_percent),
  unique (user_id, scale_name, letter_grade)
);

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid,
  task_id uuid,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  session_type text not null default 'focus' check (session_type in ('focus', 'short_break', 'long_break')),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at),
  foreign key (course_id, user_id) references public.courses(id, user_id) on delete cascade,
  foreign key (task_id, user_id) references public.tasks(id, user_id) on delete cascade
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  category text not null default 'personal',
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'custom')),
  target_value numeric(8,2) not null default 1 check (target_value > 0),
  target_unit text,
  start_date date not null default current_date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null,
  completion_date date not null default current_date,
  value numeric(8,2) not null default 1 check (value > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, completion_date),
  foreign key (habit_id, user_id) references public.habits(id, user_id) on delete cascade
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  description text,
  category text not null default 'personal' check (category in ('academic', 'financial', 'personal', 'health', 'career')),
  target_date date,
  progress_percentage smallint not null default 0 check (progress_percentage between 0 and 100),
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.goal_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null,
  title text not null check (char_length(title) between 1 and 180),
  description text,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (goal_id, user_id) references public.goals(id, user_id) on delete cascade
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  amount numeric(12,2) not null check (amount > 0),
  transaction_type text not null check (transaction_type in ('income', 'expense')),
  category text not null default 'other',
  transaction_date date not null default current_date,
  description text,
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  category text,
  amount numeric(12,2) not null check (amount > 0),
  period_start date not null,
  period_end date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create unique index budgets_user_period_category_key
  on public.budgets (user_id, period_start, coalesce(category, ''));

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  target_amount numeric(12,2) not null check (target_amount > 0),
  current_amount numeric(12,2) not null default 0 check (current_amount >= 0),
  target_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.note_folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  color text not null default 'violet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid,
  title text not null default 'Untitled note' check (char_length(title) between 1 and 240),
  content text not null default '',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (folder_id, user_id) references public.note_folders(id, user_id) on delete cascade
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  body text not null default '',
  notification_type text not null default 'general',
  read_at timestamptz,
  action_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation' check (char_length(title) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 20000),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (conversation_id, user_id) references public.ai_conversations(id, user_id) on delete cascade
);

create index courses_user_semester_idx on public.courses (user_id, semester);
create index tasks_user_due_idx on public.tasks (user_id, due_at) where status <> 'completed';
create index tasks_course_idx on public.tasks (course_id);
create index calendar_events_user_start_idx on public.calendar_events (user_id, starts_at);
create index assignments_user_due_idx on public.assignments (user_id, due_at);
create index assignments_course_idx on public.assignments (course_id);
create index exams_user_start_idx on public.exams (user_id, starts_at);
create index exams_course_idx on public.exams (course_id);
create index grade_records_course_idx on public.grade_records (course_id);
create index focus_sessions_user_start_idx on public.focus_sessions (user_id, started_at desc);
create index habits_user_active_idx on public.habits (user_id, is_active);
create index habit_completions_user_date_idx on public.habit_completions (user_id, completion_date desc);
create index goals_user_status_idx on public.goals (user_id, status);
create index transactions_user_date_idx on public.transactions (user_id, transaction_date desc);
create index budgets_user_period_idx on public.budgets (user_id, period_start, period_end);
create index savings_goals_user_status_idx on public.savings_goals (user_id, status);
create index note_folders_user_name_idx on public.note_folders (user_id, name);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index ai_conversations_user_updated_idx on public.ai_conversations (user_id, updated_at desc);
create index ai_messages_user_created_idx on public.ai_messages (user_id, created_at desc);
create index ai_messages_conversation_created_idx on public.ai_messages (conversation_id, created_at);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare
  table_name text;
  user_tables text[] := array[
    'user_preferences', 'courses', 'tasks', 'calendar_events', 'assignments', 'exams',
    'grade_records', 'grading_scales', 'focus_sessions', 'habits', 'habit_completions',
    'goals', 'goal_milestones', 'transactions', 'budgets', 'savings_goals',
    'note_folders', 'notes', 'notifications', 'ai_conversations', 'ai_messages'
  ];
begin
  grant usage on schema public to authenticated;

  alter table public.profiles enable row level security;
  create policy profiles_select_own on public.profiles
    for select to authenticated using (id = (select auth.uid()));
  grant select on public.profiles to authenticated;

  execute 'create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at()';

  foreach table_name in array user_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy users_manage_own_rows on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
      table_name
    );
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at',
      table_name
    );
  end loop;
end;
$$;

create function public.complete_onboarding(
  p_full_name text,
  p_university text,
  p_department text,
  p_course_of_study text,
  p_academic_level text,
  p_semester text,
  p_preferred_study_hours integer,
  p_main_goals text[],
  p_preferred_currency text,
  p_theme text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required to complete onboarding.' using errcode = '28000';
  end if;

  if char_length(trim(coalesce(p_full_name, ''))) not between 1 and 120 then
    raise exception 'Full name must be between 1 and 120 characters.' using errcode = '22023';
  end if;

  if p_preferred_study_hours not between 1 and 16 then
    raise exception 'Preferred study hours must be between 1 and 16.' using errcode = '22023';
  end if;

  if upper(coalesce(p_preferred_currency, '')) !~ '^[A-Z]{3}$' then
    raise exception 'Preferred currency must be a three-letter currency code.' using errcode = '22023';
  end if;

  if p_theme not in ('dark', 'light') then
    raise exception 'Theme must be dark or light.' using errcode = '22023';
  end if;

  update public.profiles
  set full_name = trim(p_full_name),
      university = nullif(trim(coalesce(p_university, '')), ''),
      department = nullif(trim(coalesce(p_department, '')), ''),
      course_of_study = nullif(trim(coalesce(p_course_of_study, '')), ''),
      academic_level = nullif(trim(coalesce(p_academic_level, '')), ''),
      semester = nullif(trim(coalesce(p_semester, '')), ''),
      onboarding_completed_at = now()
  where id = current_user_id;

  if not found then
    raise exception 'Student profile is missing. Apply the database migrations and try again.' using errcode = 'P0002';
  end if;

  insert into public.user_preferences (
    user_id, preferred_study_hours, main_goals, preferred_currency, theme
  )
  values (
    current_user_id,
    p_preferred_study_hours,
    coalesce(p_main_goals, '{}'),
    upper(p_preferred_currency),
    p_theme
  )
  on conflict (user_id) do update
  set preferred_study_hours = excluded.preferred_study_hours,
      main_goals = excluded.main_goals,
      preferred_currency = excluded.preferred_currency,
      theme = excluded.theme;
end;
$$;

revoke all on function public.complete_onboarding(text, text, text, text, text, text, integer, text[], text, text) from public, anon;
grant execute on function public.complete_onboarding(text, text, text, text, text, text, integer, text[], text, text) to authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
