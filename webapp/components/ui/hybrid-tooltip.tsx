"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

interface HybridTooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  disabled?: boolean;
  className?: string;
}

/**
 * A tooltip that works on both desktop (hover) and mobile (tap to open, tap again or outside to close).
 */
export function HybridTooltip({
  content,
  children,
  disabled = false,
  className,
}: HybridTooltipProps) {
  const [isTouch, setIsTouch] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  return (
    <Tooltip
      open={!disabled && open}
      onOpenChange={(next) => {
        if (!disabled) setOpen(next);
      }}
    >
      <TooltipTrigger
        asChild
        onClick={
          isTouch
            ? () => {
                if (!disabled) setOpen((v) => !v);
              }
            : undefined
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent className={className}>{content}</TooltipContent>
    </Tooltip>
  );
}
