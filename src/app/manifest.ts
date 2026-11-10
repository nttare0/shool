import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Student OS",
    short_name: "StudentOS",
    description:
      "Tasks, notes, flashcards, focus sessions and a whiteboard in one calm student workspace.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#1a1b22",
    theme_color: "#1a1b22",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Tasks", url: "/tasks" },
      { name: "Notes", url: "/notes" },
      { name: "Focus", url: "/focus" },
    ],
  };
}
