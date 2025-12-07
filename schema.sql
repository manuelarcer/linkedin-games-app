
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase Auth)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Scores table
create table scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) not null,
  game_type text not null check (game_type in ('Queens', 'Tango', 'Zip', 'Sudoku')),
  puzzle_id integer not null,
  puzzle_date date not null,
  time_seconds integer not null, -- Time in seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint to prevent duplicate submissions for the same puzzle/user
  unique(user_id, game_type, puzzle_id)
);

-- RLS Policies
alter table profiles enable row level security;
alter table scores enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Scores policies
create policy "Public scores are viewable by everyone" on scores for select using (true);
create policy "Users can insert their own scores" on scores for insert with check (auth.uid() = user_id);
create policy "Users can update their own scores" on scores for update using (auth.uid() = user_id);
