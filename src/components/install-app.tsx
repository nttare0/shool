"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallContext = React.createContext<{ prompt: InstallPromptEvent | null; installed: boolean; clear: () => void }>({ prompt: null, installed: false, clear: () => {} });

export function InstallProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = React.useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return <InstallContext.Provider value={{ prompt, installed, clear: () => setPrompt(null) }}>{children}</InstallContext.Provider>;
}

export function InstallApp() {
  const { prompt, installed, clear } = React.useContext(InstallContext);
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="text-sm font-semibold">Install Student OS</h2>
      <p className="mt-1 text-xs text-muted-foreground">Add Student OS to your home screen or desktop for quick access. An internet connection is needed to open the app.</p>
      {installed ? <p className="mt-3 text-sm text-muted-foreground">Student OS is installed.</p> : prompt ? (
        <Button className="mt-3" size="sm" onClick={async () => {
          await prompt.prompt();
          await prompt.userChoice;
          clear();
        }}><Download /> Install app</Button>
      ) : (
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">On iPhone or iPad, open this site in Safari, tap Share, then Add to Home Screen. On Android or desktop, use your browser menu and choose Install app or Add to Home Screen.</p>
      )}
    </section>
  );
}
