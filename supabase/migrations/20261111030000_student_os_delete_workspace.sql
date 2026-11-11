create policy "Student OS users can delete own workspace"
on public.student_os_workspaces for delete to authenticated
using ((select auth.jwt()->>'sub') = user_id);
