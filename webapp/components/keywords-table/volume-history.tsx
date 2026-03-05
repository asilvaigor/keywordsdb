"use client";

import pako from "pako";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { formatLargeNumber } from "./utils";

export interface VolumePoint {
  year: number;
  month: number;
  value: number;
  label: string; // e.g. "Jan 2024"
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const parseCache = new Map<string, VolumePoint[]>();

export function parseVolumeHistory(raw: string, ratio: number): VolumePoint[] {
  if (!raw) return [];

  const cached = parseCache.get(raw);
  if (cached) return cached;

  try {
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    const decompressed = pako.inflate(bytes, { to: "string" });

    const parts = decompressed.split(",");
    if (parts.length < 3) return [];

    const startYear = parseInt(parts[0], 10);
    const startMonth = parseInt(parts[1], 10); // 1-indexed
    const values = parts
      .slice(2)
      .map((v) => Math.round(parseInt(v, 10) * ratio));

    const points: VolumePoint[] = values.map((value, i) => {
      const totalMonths = startMonth - 1 + i;
      const year = startYear + Math.floor(totalMonths / 12);
      const month = (totalMonths % 12) + 1;
      return {
        year,
        month,
        value,
        label: `${MONTH_NAMES[month - 1]} ${year}`,
      };
    });

    parseCache.set(raw, points);
    return points;
  } catch (error) {
    console.error("Failed to parse volume history:", error);
    return [];
  }
}

function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  if (points.length === 2)
    return `M${points[0].x},${points[0].y} L${points[1].x},${points[1].y}`;

  let path = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlPointX = current.x + (next.x - current.x) / 2;

    path += ` C${controlPointX},${current.y} ${controlPointX},${next.y} ${next.x},${next.y}`;
  }

  return path;
}

function Sparkline({ points }: { points: VolumePoint[] }) {
  if (points.length === 0)
    return <span className="text-muted-foreground text-xs">—</span>;

  const width = 100;
  const height = 16;
  const pad = 2;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xStep = (width - pad * 2) / Math.max(points.length - 1, 1);

  const pathPoints = values.map((v, i) => {
    const x = pad + i * xStep;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const d = createSmoothPath(pathPoints);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Search volume history sparkline"
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        className="text-primary"
      />
    </svg>
  );
}

function VolumeHistoryModal({
  points,
  open,
  onOpenChange,
}: {
  points: VolumePoint[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 600;
  const height = 260;
  const padLeft = 60;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 48;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const xStep = chartW / Math.max(points.length - 1, 1);

  const chartPoints = values.map((v, i) => ({
    x: padLeft + i * xStep,
    y: padTop + chartH - ((v - min) / range) * chartH,
  }));

  const linePath = `M${chartPoints.map((p) => `${p.x},${p.y}`).join(" L")}`;

  // Y-axis ticks (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = min + (range * i) / 4;
    const y = padTop + chartH - (i / 4) * chartH;
    return { val, y };
  });

  // X-axis labels: show every ~6 months or so
  const labelInterval = Math.max(1, Math.floor(points.length / 8));
  const xLabels = points
    .map((p, i) => ({ ...p, x: padLeft + i * xStep }))
    .filter((_, i) => i % labelInterval === 0 || i === points.length - 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Monthly Search Volume</DialogTitle>
        </DialogHeader>
        <div>
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            role="img"
            aria-label="Monthly search volume history chart"
          >
            {/* Grid lines */}
            {yTicks.map((t) => (
              <g key={`tick-${t.y}`}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={t.y}
                  y2={t.y}
                  className="stroke-muted"
                  strokeWidth={0.5}
                />
                <text
                  x={padLeft - 8}
                  y={t.y + 4}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize={11}
                >
                  {formatLargeNumber(Math.round(t.val))}
                </text>
              </g>
            ))}

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="text-primary"
            />

            {/* Dots */}
            {chartPoints.map((p, i) => (
              <Tooltip key={`tooltip-${p.x}`}>
                <TooltipTrigger asChild>
                  <circle
                    key={`dot-${p.x}`}
                    cx={p.x}
                    cy={p.y}
                    r={2.5}
                    className="fill-primary"
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {formatLargeNumber(points[i].value, 3)}
                </TooltipContent>
              </Tooltip>
            ))}

            {/* X labels */}
            {xLabels.map((p, i) => {
              return (
                i % 2 === 0 && (
                  <text
                    key={`x-label-${p.x}`}
                    x={p.x}
                    y={height - padBottom + 18}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    fontSize={10}
                  >
                    {p.label}
                  </text>
                )
              );
            })}
          </svg>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function VolumeHistoryCell({
  raw,
  ratio,
}: {
  raw: string;
  ratio: number;
}) {
  const [open, setOpen] = useState(false);
  const points = useMemo(() => parseVolumeHistory(raw, ratio), [raw, ratio]);

  if (points.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        type="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        className="flex"
      >
        <Sparkline points={points} />
      </button>
      <VolumeHistoryModal points={points} open={open} onOpenChange={setOpen} />
    </>
  );
}
