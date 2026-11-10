"use client";

import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleAlert,
  Loader2,
  MoreHorizontal,
  X,
} from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Thin compatibility shim for the icon set the shadcn/base-ui components expect.
 * The upstream components import `Icon` from `@bklitui/icons`; we map the handful
 * of names they use onto lucide icons so the primitives stay dependency-light.
 */
export type IconName =
  | "IconChevronGrabberVertical"
  | "IconChevronTopSmall"
  | "IconChevronDownSmall"
  | "IconChevronRightSmall"
  | "IconLoadingCircle"
  | "IconCrossSmall"
  | "IconDotGrid1x3Horizontal"
  | "IconInfoCircle";

const ICONS: Record<IconName, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  IconChevronGrabberVertical: ChevronsUpDown,
  IconChevronTopSmall: ChevronUp,
  IconChevronDownSmall: ChevronDown,
  IconChevronRightSmall: ChevronRight,
  IconLoadingCircle: Loader2,
  IconCrossSmall: X,
  IconDotGrid1x3Horizontal: MoreHorizontal,
  IconInfoCircle: CircleAlert,
};

export type IconProps = React.SVGProps<SVGSVGElement> & {
  name: IconName | string;
  className?: string;
};

export function Icon({ name, className, ...props }: IconProps) {
  const Cmp = ICONS[name as IconName] ?? CircleAlert;

  return (
    <Cmp
      aria-hidden="true"
      className={cn(
        "size-4 shrink-0",
        name === "IconLoadingCircle" && "animate-spin",
        className,
      )}
      {...props}
    />
  );
}
