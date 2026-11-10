"use client";

import * as React from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = {
  prompt: InstallPromptEvent | null;
  installed: boolean;
  clear: () => void;
};
const InstallContext = React.createContext<InstallState>({ prompt: null, installed: false, clear: () => {} });

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = React.useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateInstalled = () => setInstalled(displayMode.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    updateInstalled();
    displayMode.addEventListener("change", updateInstalled);
    const onPrompt = (event: Event) => {
      // Keep the browser's own install affordances available, too.
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation can still be offered by browsers that don't require a worker.
      });
    }
    return () => {
      displayMode.removeEventListener("change", updateInstalled);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return <InstallContext.Provider value={{ prompt, installed, clear: () => setPrompt(null) }}>{children}</InstallContext.Provider>;
}

const instructions = "On iPhone or iPad, open this site in Safari, tap Share, then Add to Home Screen. On Android or desktop, open your browser menu and choose Install app or Add to Home Screen. The option may be unavailable if the app is already installed or your browser doesn't support installation.";

function InstallButton({ compact = false }: { compact?: boolean }) {
  const { prompt, installed, clear } = React.useContext(InstallContext);
  const [showHelp, setShowHelp] = React.useState(false);
  const dialog = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    if (showHelp) dialog.current?.showModal();
  }, [showHelp]);

  if (installed) return null;
  return <>
    <Button aria-label="Install Student OS" size="sm" variant="outline" onClick={async () => {
      if (!prompt) { setShowHelp(true); return; }
      try {
        await prompt.prompt();
        await prompt.userChoice;
      } catch {
        setShowHelp(true);
      } finally {
        clear();
      }
    }}><Download /><span className={compact ? "hidden sm:inline" : ""}>Install app</span></Button>
    {showHelp && <dialog ref={dialog} onClose={() => setShowHelp(false)} aria-labelledby="install-help-title" className="m-auto w-[min(90vw,28rem)] rounded-2xl border bg-card p-6 text-card-foreground shadow-xl backdrop:bg-black/50">
      <div className="flex items-center justify-between gap-3"><h2 id="install-help-title" className="font-semibold">Install Student OS</h2><Button aria-label="Close" variant="ghost" size="icon-xs" onClick={() => dialog.current?.close()}><X /></Button></div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{instructions}</p>
      <p className="mt-3 text-xs text-muted-foreground">An internet connection is needed to open the app.</p>
      <Button className="mt-5" size="sm" onClick={() => dialog.current?.close()}>Got it</Button>
    </dialog>}
  </>;
}

export function InstallShortcut() {
  return <InstallButton compact />;
}

export function InstallApp() {
  const { installed } = React.useContext(InstallContext);
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="text-sm font-semibold">Install Student OS</h2>
      <p className="mt-1 text-xs text-muted-foreground">Add Student OS to your home screen or desktop for quick access. An internet connection is needed to open the app.</p>
      {installed ? <p className="mt-3 text-sm text-muted-foreground">Student OS is installed.</p> : <div className="mt-3"><InstallButton /></div>}
      {!installed && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{instructions}</p>}
    </section>
  );
}
