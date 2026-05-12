create table schedule_blocks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  date       date not null,
  start_time time not null,
  end_time   time not null,
  type       text not null check (type in ('single', 'pomodoro')),
  label      text,
  created_at timestamptz not null default now()
);

create table schedule_block_tasks (
  id         uuid primary key default gen_random_uuid(),
  block_id   uuid not null references schedule_blocks(id) on delete cascade,
  task_id    uuid not null references tasks(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(block_id, task_id)
);

create index schedule_blocks_user_date_idx on schedule_blocks(user_id, date);
create index schedule_block_tasks_block_id_idx on schedule_block_tasks(block_id);
