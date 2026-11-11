create table public.student_os_workspaces (
  user_id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.student_os_workspaces enable row level security;
create policy "Student OS users can read own workspace" on public.student_os_workspaces for select to authenticated using ((select auth.jwt()->>'sub') = user_id);
create policy "Student OS users can create own workspace" on public.student_os_workspaces for insert to authenticated with check ((select auth.jwt()->>'sub') = user_id);
create policy "Student OS users can update own workspace" on public.student_os_workspaces for update to authenticated using ((select auth.jwt()->>'sub') = user_id) with check ((select auth.jwt()->>'sub') = user_id);
