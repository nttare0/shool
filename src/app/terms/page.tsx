import Link from "next/link";

export default function TermsPage() {
  return <main className="mx-auto max-w-2xl space-y-6 px-4 py-10 text-sm leading-relaxed sm:px-6">
    <Link className="text-muted-foreground underline" href="/settings">← Back to settings</Link>
    <h1 className="text-3xl font-semibold">Terms &amp; conditions</h1>
    <p className="rounded-lg border p-3 text-muted-foreground">These terms are a draft for the site owner to review before relying on them as a legal agreement.</p>
    <section><h2 className="mb-2 text-lg font-medium">Using Student OS</h2><p>Student OS provides tools for organizing study activities. Use the service lawfully, respect others, and keep your account credentials secure. You are responsible for the content you add.</p></section>
    <section><h2 className="mb-2 text-lg font-medium">Your data</h2><p>Guest workspaces are stored in your browser. Signed-in workspaces are stored in Supabase when synchronization succeeds; signing in is provided by Clerk. Guest and account workspaces are separate. Export backups regularly: browser data can be cleared, sync can fail, and edits from different devices may overwrite each other.</p></section>
    <section><h2 className="mb-2 text-lg font-medium">Account deletion</h2><p>In Settings, signed-in users can request deletion of their account and its saved workspace. Export a copy first if needed. Copies saved on other devices and backups outside the app are not automatically removed.</p></section>
    <section><h2 className="mb-2 text-lg font-medium">Availability</h2><p>The service may change or be interrupted. Please do not rely on it as the only copy of important information.</p></section>
  </main>;
}
