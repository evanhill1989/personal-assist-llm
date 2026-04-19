create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'completed')),
  priority text check (priority in ('low', 'medium', 'high')),
  due_date date,
  project text,
  contact_name text,
  created_at timestamptz not null default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text not null,
  tags text[],
  related_project text,
  contact_name text,
  created_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  email text,
  relationship text,
  company text,
  notes text,
  last_contacted date
);

create table user_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  field text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, field)
);
