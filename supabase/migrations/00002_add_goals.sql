-- Create goals table
create table goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  title       text not null,
  status      text not null default 'on_track' check (status in ('on_track', 'at_risk', 'stalled')),
  status_note text,
  progress    int not null default 0 check (progress >= 0 and progress <= 100),
  target_date date,
  created_at  timestamptz not null default now()
);

-- Add goal_id FK to tasks
alter table tasks
  add column goal_id uuid references goals(id) on delete set null;

-- Index for common lookups
create index goals_user_id_idx on goals(user_id);
create index tasks_goal_id_idx on tasks(goal_id);