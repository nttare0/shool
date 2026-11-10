"use client";

import { curveNatural } from "d3-shape";
import * as React from "react";

import { AreaChart } from "@/components/charts/area-chart";
import { Area as AreaSeries } from "@/components/charts/area";
import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarXAxis } from "@/components/charts/bar-x-axis";
import { Gauge } from "@/components/charts/gauge";
import { Grid } from "@/components/charts/grid";
import {
  HeatmapCells,
  HeatmapChart,
  HeatmapInteractionBoundary,
  HeatmapInteractionProvider,
  HeatmapLegend,
  HeatmapTooltip,
  HeatmapXAxis,
  HeatmapYAxis,
} from "@/components/charts/heatmap";
import { RadarArea } from "@/components/charts/radar-area";
import { RadarAxis } from "@/components/charts/radar-axis";
import { RadarChart } from "@/components/charts/radar-chart";
import { RadarGrid } from "@/components/charts/radar-grid";
import { RadarLabels } from "@/components/charts/radar-labels";
import { Ring } from "@/components/charts/ring";
import { RingCenter } from "@/components/charts/ring-center";
import { RingChart } from "@/components/charts/ring-chart";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";

export type FocusPoint = { date: Date; minutes: number };
export type WeekdayPoint = { name: string; completed: number; day: string };
export type RingPoint = { label: string; value: number; maxValue: number; color: string };
export type RadarMetric = { key: string; label: string };
export type HeatCell = { bin: number; count: number; date: Date };
export type HeatWeek = { bin: number; bins: HeatCell[] };

export function FocusAreaChart({ data }: { data: FocusPoint[] }) {
  return (
    <AreaChart aspectRatio="2.6 / 1" animationDuration={1000} data={data}>
      <Grid horizontal />
      <AreaSeries
        curve={curveNatural}
        dataKey="minutes"
        fillOpacity={0.32}
        strokeWidth={2.5}
      />
      <XAxis />
      <ChartTooltip />
    </AreaChart>
  );
}

export function CompletionsBarChart({ data }: { data: WeekdayPoint[] }) {
  return (
    <BarChart aspectRatio="2.4 / 1" barGap={0.35} data={data} xDataKey="name">
      <Grid horizontal />
      <Bar dataKey="completed" fill="var(--chart-line-primary)" lineCap="round" />
      <BarXAxis />
      <ChartTooltip />
    </BarChart>
  );
}

export function SubjectRingChart({ data }: { data: RingPoint[] }) {
  return (
    <RingChart className="max-w-[220px]" data={data} strokeWidth={13}>
      {data.map((entry, index) => (
        <Ring color={entry.color} index={index} key={entry.label} />
      ))}
      <RingCenter defaultLabel="Open tasks" />
    </RingChart>
  );
}

export function MasteryRadarChart({
  data,
  metrics,
}: {
  data: { label: string; values: Record<string, number> }[];
  metrics: RadarMetric[];
}) {
  return (
    <RadarChart className="max-w-[280px]" data={data} metrics={metrics}>
      <RadarGrid />
      <RadarAxis />
      <RadarLabels fontSize={10} offset={18} />
      {data.map((row, index) => (
        <RadarArea color="var(--chart-line-primary)" index={index} key={row.label} />
      ))}
    </RadarChart>
  );
}

export function GoalGauge({ value, minutes, goal }: { value: number; minutes: number; goal: number }) {
  return (
    <Gauge
      activeFill="var(--chart-line-primary)"
      centerValue={minutes}
      className="mx-auto max-w-[260px]"
      defaultLabel={`of ${goal}m goal`}
      minWidth={0}
      suffix="m"
      totalNotches={36}
      value={value}
    />
  );
}

export function StreakHeatmap({ data }: { data: HeatWeek[] }) {
  return (
    <HeatmapInteractionProvider>
      <HeatmapInteractionBoundary>
        <div className="flex w-full flex-col items-stretch gap-3">
          <HeatmapChart className="w-full" data={data} layout="fluid" weekStartDay={1}>
            <HeatmapCells />
            <HeatmapXAxis />
            <HeatmapYAxis />
            <HeatmapTooltip />
          </HeatmapChart>
          <HeatmapLegend />
        </div>
      </HeatmapInteractionBoundary>
    </HeatmapInteractionProvider>
  );
}

export function ChartFrame({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-2xl border bg-card p-4 sm:p-5 ${className ?? ""}`}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
