"use client";

import {
  ArrowRight,
  Check,
  Layers,
  Plus,
  RotateCcw,
  Sparkles,
  Eye,
  ChevronRight,
  BookOpen,
  Trash2,
  X,
} from "lucide-react";
import * as React from "react";

import { PageHeading, Skeleton } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore, useSubjects } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function FlashcardsPage() {
  const { state, ready, addDeck, deleteDeck, addCard, reviewCard, deleteCard } = useStore();
  const subjects = useSubjects();

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [deckFormOpen, setDeckFormOpen] = React.useState(false);
  const [deckName, setDeckName] = React.useState("");
  const [deckSubject, setDeckSubject] = React.useState("");
  const [front, setFront] = React.useState("");
  const [back, setBack] = React.useState("");
  const [flipped, setFlipped] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (!ready) return;
    if (!selectedId && state.decks.length) setSelectedId(state.decks[0].id);
    if (selectedId && !state.decks.some((deck) => deck.id === selectedId)) {
      setSelectedId(state.decks[0]?.id ?? null);
    }
  }, [ready, selectedId, state.decks]);

  const deck = state.decks.find((item) => item.id === selectedId) ?? null;

  React.useEffect(() => {
    setFlipped(false);
    setIndex(0);
  }, [selectedId]);

  const totalCards = state.decks.reduce((sum, item) => sum + item.cards.length, 0);
  const totalMastered = state.decks.reduce(
    (sum, item) => sum + item.cards.filter((card) => card.box >= 3).length,
    0,
  );

  const safeIndex = deck?.cards.length ? Math.min(index, deck.cards.length - 1) : 0;
  const currentCard = deck?.cards[safeIndex] ?? null;

  function submitDeck(event: React.FormEvent) {
    event.preventDefault();
    if (!deckName.trim()) return;
    const id = addDeck(deckName, deckSubject || null);
    setSelectedId(id);
    setDeckName("");
    setDeckSubject("");
    setDeckFormOpen(false);
  }

  function submitCard(event: React.FormEvent) {
    event.preventDefault();
    if (!deck || !front.trim() || !back.trim()) return;
    addCard(deck.id, front, back);
    setFront("");
    setBack("");
  }

  function advance(gotIt: boolean) {
    if (!deck || !currentCard) return;
    reviewCard(deck.id, currentCard.id, gotIt);
    setFlipped(false);
    setIndex((safeIndex + 1) % deck.cards.length);
  }

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-[26rem] w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeading
        action={
          <Button onClick={() => setDeckFormOpen((open) => !open)} size="sm">
            {deckFormOpen ? <X /> : <Plus />}
            {deckFormOpen ? "Close" : "New deck"}
          </Button>
        }
        description={`${state.decks.length} decks · ${totalCards} cards · ${totalMastered} mastered · Leitner spaced repetition`}
        title="Flashcards"
      />

      {deckFormOpen ? (
        <form className="mb-4 rounded-2xl border bg-card p-4" onSubmit={submitDeck}>
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deck-name">Deck name</Label>
              <Input
                autoFocus
                id="deck-name"
                onChange={(event) => setDeckName(event.target.value)}
                placeholder="e.g. Bio: respiration & photosynthesis"
                value={deckName}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="deck-subject">Subject</Label>
              <select
                className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                id="deck-subject"
                onChange={(event) => setDeckSubject(event.target.value)}
                value={deckSubject}
              >
                <option value="">General</option>
                {state.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <Button disabled={!deckName.trim()} size="sm" type="submit">
              Create deck
            </Button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="scrollbar-slim flex max-h-[30rem] flex-col gap-2 overflow-y-auto lg:max-h-[64vh]">
          {state.decks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-4 py-12 text-center">
              <Layers className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No decks yet.</p>
              <Button onClick={() => setDeckFormOpen(true)} size="xs" variant="outline">
                <Plus /> Create one
              </Button>
            </div>
          ) : (
            state.decks.map((item) => {
              const due = item.cards.filter((card) => card.box < 2).length;
              const mastered = item.cards.filter((card) => card.box >= 3).length;
              const pct = item.cards.length ? Math.round((mastered / item.cards.length) * 100) : 0;
              const subject = subjects.byId(item.subjectId);
              return (
                <button
                  className={cn(
                    "rounded-2xl border bg-card p-3 text-left transition-colors hover:border-foreground/20",
                    item.id === selectedId && "border-primary/40 bg-primary/[0.04]",
                  )}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-snug">{item.name}</p>
                    {due > 0 ? (
                      <Badge size="sm" variant="warning">
                        {due}
                      </Badge>
                    ) : (
                      <Badge size="sm" variant="success">
                        <Check />
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {item.cards.length} cards · {subject?.name ?? "General"}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{pct}% mastered</p>
                </button>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-4">
          {deck ? (
            <>
              <div className="rounded-2xl border bg-card p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">{deck.name}</h2>
                    <p className="text-[11px] text-muted-foreground">
                      Card {deck.cards.length ? safeIndex + 1 : 0} of {deck.cards.length}
                    </p>
                  </div>
                  <Button
                    aria-label="Delete deck"
                    onClick={() => deleteDeck(deck.id)}
                    size="icon-xs"
                    variant="ghost"
                  >
                    <Trash2 />
                  </Button>
                </div>

                {currentCard ? (
                  <>
                    <div className="overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.09] via-card to-primary/[0.03]">
                      <div className="flex items-center justify-between gap-3 border-b border-primary/10 px-5 py-3">
                        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><BookOpen className="size-4" /> Study card</span>
                        <Badge size="sm" variant="outline">Box {currentCard.box + 1} / 5</Badge>
                      </div>
                      <div className="flex min-h-[15rem] flex-col justify-center px-6 py-8 text-center sm:px-10">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Question</p>
                        <p className="mx-auto mt-4 max-w-2xl whitespace-pre-wrap break-words text-xl font-semibold leading-relaxed sm:text-2xl">{currentCard.front}</p>
                        {flipped ? (
                          <div className="mx-auto mt-7 w-full max-w-2xl rounded-xl border border-primary/15 bg-background/80 px-5 py-5" aria-live="polite">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Answer</p>
                            <p className="mt-3 whitespace-pre-wrap break-words text-base leading-relaxed">{currentCard.back}</p>
                          </div>
                        ) : (
                          <div className="mt-8"><Button onClick={() => setFlipped(true)} type="button"><Eye /> Show answer</Button></div>
                        )}
                      </div>
                      <div className="h-1 bg-primary/10" aria-hidden="true"><div className="h-full bg-primary transition-all" style={{ width: `${((safeIndex + 1) / deck.cards.length) * 100}%` }} /></div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <Button onClick={() => { setFlipped(false); setIndex((safeIndex + 1) % deck.cards.length); }} size="sm" variant="ghost">
                        Skip <ChevronRight />
                      </Button>
                      {flipped ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="mr-1 text-xs text-muted-foreground">How did you do?</span>
                          <Button onClick={() => advance(false)} size="sm" variant="outline"><RotateCcw /> Again</Button>
                          <Button onClick={() => advance(true)} size="sm"><Check /> Got it</Button>
                        </div>
                      ) : <p className="text-xs text-muted-foreground">Reveal the answer to rate your recall</p>}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Sparkles className="size-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      This deck is empty — add your first card below.
                    </p>
                  </div>
                )}
              </div>

              <form className="rounded-2xl border bg-card p-4" onSubmit={submitCard}>
                <h3 className="mb-3 text-sm font-semibold">Add a card</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="card-front">Front (prompt)</Label>
                    <Input
                      id="card-front"
                      onChange={(event) => setFront(event.target.value)}
                      placeholder="Where does glycolysis happen?"
                      value={front}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="card-back">Back (answer)</Label>
                    <Input
                      id="card-back"
                      onChange={(event) => setBack(event.target.value)}
                      placeholder="In the cytosol — no oxygen required."
                      value={back}
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button disabled={!front.trim() || !back.trim()} size="sm" type="submit">
                    <Plus /> Add card
                  </Button>
                </div>
              </form>

              {deck.cards.length ? (
                <div className="rounded-2xl border bg-card">
                  <div className="border-b px-4 py-2.5 text-xs font-medium text-muted-foreground">
                    All cards in this deck
                  </div>
                  <ul className="divide-y">
                    {deck.cards.map((card) => (
                      <li className="group flex items-start gap-3 px-4 py-2.5" key={card.id}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">{card.front}</p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground"><span className="font-medium">Answer: </span>{card.back}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, boxIndex) => (
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  boxIndex <= card.box ? "bg-primary" : "bg-muted",
                                )}
                                key={boxIndex}
                              />
                            ))}
                          </div>
                          <Button
                            aria-label="Delete card"
                            className="sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 focus-visible:opacity-100"
                            onClick={() => {
                              const deletedIndex = deck.cards.findIndex((item) => item.id === card.id);
                              if (deletedIndex === safeIndex) setFlipped(false);
                              if (deletedIndex < safeIndex) setIndex(safeIndex - 1);
                              else setIndex(Math.min(safeIndex, Math.max(0, deck.cards.length - 2)));
                              deleteCard(deck.id, card.id);
                            }}
                            size="icon-xs"
                            variant="ghost"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex min-h-[20rem] flex-col items-center justify-center gap-3 rounded-2xl border bg-card p-8 text-center">
              <Layers className="size-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">No deck selected</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Create a deck to start building your recall muscle.
                </p>
              </div>
              <Button onClick={() => setDeckFormOpen(true)} size="xs" variant="outline">
                <Plus /> New deck <ArrowRight />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
