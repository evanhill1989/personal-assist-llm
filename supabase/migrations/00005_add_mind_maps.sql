create table mind_maps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null,
  title       text not null,
  created_at  timestamptz not null default now()
);

create table mind_map_nodes (
  id             uuid primary key default gen_random_uuid(),
  map_id         uuid not null references mind_maps(id) on delete cascade,
  parent_node_id uuid references mind_map_nodes(id) on delete cascade,
  label          text not null default '',
  task_id        uuid references tasks(id) on delete set null,
  node_type      text not null default 'label' check (node_type in ('label', 'task')),
  created_at     timestamptz not null default now()
);

create index mind_maps_user_id_idx on mind_maps(user_id);
create index mind_map_nodes_map_id_idx on mind_map_nodes(map_id);
create index mind_map_nodes_parent_idx on mind_map_nodes(parent_node_id);
