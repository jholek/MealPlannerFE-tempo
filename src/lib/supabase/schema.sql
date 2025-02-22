-- Create recipes table with JSON storage
create table recipes (
  id uuid primary key default uuid_generate_v4(),
  data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table recipes enable row level security;

-- Create policy to allow all operations for now (you can restrict this later)
create policy "Allow all operations" on recipes
  for all
  using (true)
  with check (true);