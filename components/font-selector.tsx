"use client";

import { Type } from "lucide-react";
import { type FontFamily, fontOptions, useFont } from "./font-provider";

export function FontSelector() {
  const { font, setFont } = useFont();

  return (
    <div className="flex items-center gap-2">
      <Type className="h-4 w-4 text-muted-foreground" />
      <select
        aria-label="Select font"
        className="h-8 rounded-md border border-border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        onChange={(e) => setFont(e.target.value as FontFamily)}
        value={font}
      >
        {fontOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
