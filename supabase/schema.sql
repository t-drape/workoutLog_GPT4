create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  notes text not null default '',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists templates_user_updated_idx
  on public.templates(user_id, updated_at desc);

create table if not exists public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  sort_order integer not null,
  name text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, sort_order)
);

create index if not exists template_exercises_template_idx
  on public.template_exercises(template_id, sort_order);

create table if not exists public.template_sets (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null references public.template_exercises(id) on delete cascade,
  sort_order integer not null,
  reps integer not null check (reps >= 0),
  weight numeric(8,2) not null default 0 check (weight >= 0),
  rest_sec integer not null default 90 check (rest_sec >= 0),
  notes text not null default '',
  unique (template_exercise_id, sort_order)
);

create index if not exists template_sets_exercise_idx
  on public.template_sets(template_exercise_id, sort_order);

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_template_id uuid references public.templates(id) on delete set null,
  name text not null check (char_length(trim(name)) > 0),
  notes text not null default '',
  status text not null check (status in ('active', 'paused', 'finished', 'discarded')),
  started_at timestamptz not null,
  paused_at timestamptz,
  total_paused_ms integer not null default 0 check (total_paused_ms >= 0),
  rest_until timestamptz,
  finished_at timestamptz,
  duration_ms integer check (duration_ms >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workouts_user_status_started_idx
  on public.workouts(user_id, status, started_at desc);

create index if not exists workouts_user_finished_idx
  on public.workouts(user_id, finished_at desc)
  where status = 'finished';

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  sort_order integer not null,
  name text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workout_id, sort_order)
);

create index if not exists workout_exercises_workout_idx
  on public.workout_exercises(workout_id, sort_order);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  sort_order integer not null,
  reps integer not null check (reps >= 0),
  weight numeric(8,2) not null default 0 check (weight >= 0),
  rest_sec integer not null default 90 check (rest_sec >= 0),
  notes text not null default '',
  completed boolean not null default false,
  completed_at timestamptz,
  unique (workout_exercise_id, sort_order)
);

create index if not exists workout_sets_exercise_idx
  on public.workout_sets(workout_exercise_id, sort_order);

alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.template_sets enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "templates_select_own" on public.templates
  for select using (auth.uid() = user_id);
create policy "templates_insert_own" on public.templates
  for insert with check (auth.uid() = user_id);
create policy "templates_update_own" on public.templates
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "templates_delete_own" on public.templates
  for delete using (auth.uid() = user_id);

create policy "template_exercises_select_own" on public.template_exercises
  for select using (
    exists (
      select 1 from public.templates t
      where t.id = template_id and t.user_id = auth.uid()
    )
  );
create policy "template_exercises_insert_own" on public.template_exercises
  for insert with check (
    exists (
      select 1 from public.templates t
      where t.id = template_id and t.user_id = auth.uid()
    )
  );
create policy "template_exercises_update_own" on public.template_exercises
  for update using (
    exists (
      select 1 from public.templates t
      where t.id = template_id and t.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.templates t
      where t.id = template_id and t.user_id = auth.uid()
    )
  );
create policy "template_exercises_delete_own" on public.template_exercises
  for delete using (
    exists (
      select 1 from public.templates t
      where t.id = template_id and t.user_id = auth.uid()
    )
  );

create policy "template_sets_select_own" on public.template_sets
  for select using (
    exists (
      select 1
      from public.template_exercises te
      join public.templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.user_id = auth.uid()
    )
  );
create policy "template_sets_insert_own" on public.template_sets
  for insert with check (
    exists (
      select 1
      from public.template_exercises te
      join public.templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.user_id = auth.uid()
    )
  );
create policy "template_sets_update_own" on public.template_sets
  for update using (
    exists (
      select 1
      from public.template_exercises te
      join public.templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.template_exercises te
      join public.templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.user_id = auth.uid()
    )
  );
create policy "template_sets_delete_own" on public.template_sets
  for delete using (
    exists (
      select 1
      from public.template_exercises te
      join public.templates t on t.id = te.template_id
      where te.id = template_exercise_id and t.user_id = auth.uid()
    )
  );

create policy "workouts_select_own" on public.workouts
  for select using (auth.uid() = user_id);
create policy "workouts_insert_own" on public.workouts
  for insert with check (auth.uid() = user_id);
create policy "workouts_update_own" on public.workouts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "workouts_delete_own" on public.workouts
  for delete using (auth.uid() = user_id);

create policy "workout_exercises_select_own" on public.workout_exercises
  for select using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );
create policy "workout_exercises_insert_own" on public.workout_exercises
  for insert with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );
create policy "workout_exercises_update_own" on public.workout_exercises
  for update using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );
create policy "workout_exercises_delete_own" on public.workout_exercises
  for delete using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

create policy "workout_sets_select_own" on public.workout_sets
  for select using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );
create policy "workout_sets_insert_own" on public.workout_sets
  for insert with check (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );
create policy "workout_sets_update_own" on public.workout_sets
  for update using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );
create policy "workout_sets_delete_own" on public.workout_sets
  for delete using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_exercise_id and w.user_id = auth.uid()
    )
  );
