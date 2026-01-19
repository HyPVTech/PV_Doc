"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type FontFamily = "arial" | "roboto" | "open-sans" | "inter" | "system";

interface FontContextType {
  font: FontFamily;
  setFont: (font: FontFamily) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

const FONT_STORAGE_KEY = "docs-font-family";

export const fontOptions: { value: FontFamily; label: string }[] = [
  { value: "arial", label: "Arial" },
  { value: "roboto", label: "Roboto" },
  { value: "open-sans", label: "Open Sans" },
  { value: "inter", label: "Inter" },
  { value: "system", label: "System" },
];

export function FontProvider({ children }: { children: ReactNode }) {
  const [font, setFontState] = useState<FontFamily>("arial");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedFont = localStorage.getItem(FONT_STORAGE_KEY) as FontFamily;
    if (savedFont && fontOptions.some((f) => f.value === savedFont)) {
      setFontState(savedFont);
    }
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    // Remove all font classes
    document.documentElement.classList.remove(
      "font-arial",
      "font-roboto",
      "font-open-sans",
      "font-inter",
      "font-system"
    );
    // Add the selected font class
    document.documentElement.classList.add(`font-${font}`);
    // Save to localStorage
    localStorage.setItem(FONT_STORAGE_KEY, font);
  }, [font, mounted]);

  const setFont = (newFont: FontFamily) => {
    setFontState(newFont);
  };

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
}
