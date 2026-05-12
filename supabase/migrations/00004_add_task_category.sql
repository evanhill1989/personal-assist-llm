alter table tasks
  add column category text check (category in ('work', 'personal'));
