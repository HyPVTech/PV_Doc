import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { Home, Settings } from "lucide-react";
import { FontSelector } from "@/components/font-selector";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
  themeSwitch: {
    enabled: true,
    mode: "light-dark-system",
  },
  nav: {
    title: (
      <div className="flex items-center gap-2">
        <span className="font-bold tracking-wide">FumaPayload</span>
      </div>
    ),
    children: <FontSelector />,
  },
  links: [
    {
      text: "Home",
      url: "/",
      active: "url",
      icon: <Home />,
    },
    {
      text: "Admin",
      url: "/admin",
      active: "url",
      icon: <Settings />,
    },
  ],
};

export const homeOptions: BaseLayoutProps = {
  ...baseOptions,
  links: [
    {
      text: "Admin",
      url: "/admin",
      active: "url",
    },
  ],
};
