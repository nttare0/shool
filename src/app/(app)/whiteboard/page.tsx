"use client";

import { Eraser, Pen, Redo2, Trash2, Undo2 } from "lucide-react";
import * as React from "react";

import { PageHeading } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import type { Stroke } from "@/lib/types";
import { cn } from "@/lib/utils";

const COLORS = [
  { name: "Ink", value: "#e8e8ef" },
  { name: "Indigo", value: "#8b8bff" },
  { name: "Mint", value: "#63e6be" },
  { name: "Amber", value: "#ffc078" },
  { name: "Rose", value: "#ff8fab" },
];

const SIZES = [2, 4, 8, 14];

export default function WhiteboardPage() {
  const { state, ready, setWhiteboard, clearWhiteboard } = useStore();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const wrapRef = React.useRef<HTMLDivElement | null>(null);

  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const [color, setColor] = React.useState(COLORS[1].value);
  const [size, setSize] = React.useState(4);
  const [erasing, setErasing] = React.useState(false);
  const [redoStack, setRedoStack] = React.useState<Stroke[]>([]);
  const drawing = React.useRef(false);
  const hydrated = React.useRef(false);
  const strokesRef = React.useRef<Stroke[]>(strokes);
  strokesRef.current = strokes;

  // Load the saved board once.
  React.useEffect(() => {
    if (!ready || hydrated.current) return;
    hydrated.current = true;
    setStrokes(state.whiteboard ?? []);
  }, [ready, state.whiteboard]);

  const redraw = React.useCallback((list: Stroke[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    for (const stroke of list) {
      if (stroke.points.length === 0) continue;
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = stroke.erase ? "#171821" : stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.globalCompositeOperation = stroke.erase ? "destination-out" : "source-over";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (const point of stroke.points.slice(1)) {
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  }, []);

  // Size the canvas to its container, then repaint.
  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = wrap.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      redraw(strokes);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redraw]);

  React.useEffect(() => {
    redraw(strokes);
  }, [strokes, redraw]);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    // Read the geometry synchronously: React nulls `currentTarget` once this
    // handler returns, so dereferencing the event inside a state updater throws.
    const point = pointFromEvent(event);
    drawing.current = true;
    setRedoStack([]);
    setStrokes((prev) => [
      ...prev,
      {
        points: [point],
        color,
        width: erasing ? size * 2.5 : size,
        erase: erasing,
      },
    ]);
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const point = pointFromEvent(event);
    setStrokes((prev) => {
      if (!prev.length) return prev;
      const next = prev.slice();
      const last = { ...next[next.length - 1] };
      last.points = [...last.points, point];
      next[next.length - 1] = last;
      return next;
    });
  }

  function finishStroke() {
    if (!drawing.current) return;
    drawing.current = false;
    // Use the ref so a stroke finished in the same tick as the last pointermove
    // isn't persisted from a stale closure.
    setWhiteboard(strokesRef.current);
  }

  function undo() {
    setStrokes((prev) => {
      if (!prev.length) return prev;
      const next = prev.slice(0, -1);
      setRedoStack((redo) => [...redo, prev[prev.length - 1]]);
      setWhiteboard(next);
      return next;
    });
  }

  function redo() {
    setRedoStack((redo) => {
      if (!redo.length) return redo;
      const restored = redo[redo.length - 1];
      const next = [...strokesRef.current, restored];
      setStrokes(next);
      setWhiteboard(next);
      return redo.slice(0, -1);
    });
  }

  function clear() {
    setStrokes([]);
    setRedoStack([]);
    clearWhiteboard();
  }

  return (
    <div>
      <PageHeading
        description="Sketch a diagram, map out an essay, or just think out loud. Strokes are saved with your workspace."
        title="Whiteboard"
      />

      <div className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
          <div className="flex items-center gap-1">
            {COLORS.map((option) => (
              <button
                aria-label={option.name}
                className={cn(
                  "grid size-6 place-items-center rounded-full border-2 transition-transform hover:scale-110",
                  color === option.value && !erasing ? "border-primary" : "border-transparent",
                )}
                key={option.value}
                onClick={() => {
                  setColor(option.value);
                  setErasing(false);
                }}
                type="button"
              >
                <span
                  className="size-4 rounded-full"
                  style={{ backgroundColor: option.value }}
                />
              </button>
            ))}
          </div>

          <span className="mx-1 h-5 w-px bg-border" />

          <div className="flex items-center gap-1">
            {SIZES.map((option) => (
              <button
                aria-label={`Pen size ${option}`}
                className={cn(
                  "grid size-6 place-items-center rounded-md transition-colors hover:bg-muted",
                  size === option && "bg-muted",
                )}
                key={option}
                onClick={() => setSize(option)}
                type="button"
              >
                <span
                  className="rounded-full bg-foreground"
                  style={{ width: option, height: option }}
                />
              </button>
            ))}
          </div>

          <span className="mx-1 h-5 w-px bg-border" />

          <Button
            onClick={() => setErasing((prev) => !prev)}
            size="xs"
            variant={erasing ? "default" : "ghost"}
          >
            {erasing ? <Eraser /> : <Pen />}
            {erasing ? "Eraser on" : "Pen"}
          </Button>
          <Button disabled={!strokes.length} onClick={undo} size="xs" variant="ghost">
            <Undo2 /> Undo
          </Button>
          <Button disabled={!redoStack.length} onClick={redo} size="xs" variant="ghost">
            <Redo2 /> Redo
          </Button>
          <Button className="ml-auto" onClick={clear} size="xs" variant="ghost">
            <Trash2 /> Clear
          </Button>
        </div>

        <div
          className="relative h-[58vh] min-h-[320px] w-full touch-none bg-[oklch(0.19_0.015_268)]"
          ref={wrapRef}
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.09) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        >
          <canvas
            className="absolute inset-0 cursor-crosshair"
            onPointerCancel={finishStroke}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={finishStroke}
            ref={canvasRef}
          />
          {strokes.length === 0 ? (
            <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm text-white/35">
              Draw something — a mind map, a timeline, a doodle.
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-muted-foreground">
        Tip: the board keeps your last 800 strokes. Cleared boards can&apos;t be recovered.
      </p>
    </div>
  );
}
