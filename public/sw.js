// Network-first: never cache personal workspace data or stale application pages.
// This worker provides a clear fallback, not offline access to the workspace.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => new Response(
    '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Student OS is offline</title><body style="font:16px system-ui;max-width:32rem;margin:4rem auto;padding:1rem"><h1>You’re offline</h1><p>Student OS needs an internet connection to open. Reconnect and try again.</p><button onclick="location.reload()">Try again</button></body></html>',
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  )));
});
