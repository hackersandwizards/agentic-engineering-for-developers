"use client";

import { ChakraProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { dialogAnatomy } from "@chakra-ui/react/anatomy";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useServerInsertedHTML } from "next/navigation";
import { useState } from "react";

// Chakra's colour palettes, pointed at the brand roles in brand.css. Washes
// take the brand's opacity ladder: 7, 15 and 25 %.
const palette = (fg: string, solid = fg, contrast = "var(--on-accent)") => ({
  fg: { value: fg },
  solid: { value: solid },
  contrast: { value: contrast },
  subtle: { value: `color-mix(in srgb, ${solid} 7%, transparent)` },
  muted: { value: `color-mix(in srgb, ${solid} 15%, transparent)` },
  emphasized: { value: `color-mix(in srgb, ${solid} 25%, transparent)` },
  focusRing: { value: "var(--focus)" },
  border: { value: solid },
});

// A field's edge needs 3:1 (WCAG 1.4.11); the hairline border has 1.4:1. An
// invalid field draws its line twice as thick in the error red; focused, the
// focus ring takes over.
const field = {
  variants: {
    variant: {
      outline: {
        borderColor: "border.emphasized",
        _invalid: {
          "&:not(:focus)": {
            boxShadow: "inset 0 0 0 1px var(--error-color)",
          },
        },
      },
    },
  },
};

// The brand corner belongs to the outermost block: a word button takes it, and
// inside a block with it (blockCorner) --radius-brand is the small corner.
const button = { base: { borderRadius: "var(--radius-brand)" } };
const blockCorner = { "--radius-brand": "var(--radius-sm)" };

const system = createSystem(defaultConfig, {
  // Light or dark follows the operating system (Apple HIG, Dark Mode).
  conditions: {
    light: "@media (prefers-color-scheme: light)",
    dark: "@media (prefers-color-scheme: dark)",
  },
  theme: {
    recipes: { button, input: field, textarea: field },
    slotRecipes: {
      dialog: {
        slots: dialogAnatomy.keys(),
        base: { content: blockCorner },
      },
    },
    layerStyles: {
      block: {
        value: {
          bg: "bg.panel",
          borderWidth: "1px",
          borderRadius: "l3",
          boxShadow: "sm",
          ...blockCorner,
        },
      },
    },
    tokens: {
      fonts: {
        heading: { value: "var(--font-mono)" },
        body: { value: "var(--font-sans)" },
      },
    },
    semanticTokens: {
      radii: {
        l1: { value: "var(--radius-sm)" },
        l2: { value: "var(--radius-sm)" },
        l3: { value: "var(--radius-brand)" },
      },
      shadows: {
        sm: { value: "var(--shadow-card)" },
        lg: { value: "var(--shadow-overlay)" },
      },
      colors: {
        bg: {
          DEFAULT: { value: "var(--background)" },
          panel: { value: "var(--surface)" },
        },
        fg: {
          DEFAULT: { value: "var(--foreground)" },
          muted: { value: "var(--foreground-muted)" },
          error: { value: "var(--error)" },
          success: { value: "var(--success)" },
        },
        border: {
          DEFAULT: { value: "var(--border)" },
          emphasized: { value: "var(--input)" },
          error: { value: "var(--error)" },
        },
        teal: palette("var(--accent)"),
        red: palette("var(--error)"),
        green: palette("var(--success)"),
        purple: palette("var(--hue-purple)"),
      },
    },
  },
});

// Chakra's Next.js guide: hand Emotion's server styles to the document head, so
// no <style> tag sits in <body> where React hydrates.
function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, inserted }] = useState(() => {
    const cache = createCache({ key: "css" });
    cache.compat = true;
    const previousInsert = cache.insert;
    const inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return previousInsert(...args);
    };
    return { cache, inserted };
  });

  useServerInsertedHTML(() => {
    const names = inserted.splice(0);
    if (names.length === 0) return null;
    return (
      <style
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{
          __html: names.map((name) => cache.inserted[name]).join(""),
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <EmotionRegistry>
        <ChakraProvider value={system}>{children}</ChakraProvider>
      </EmotionRegistry>
    </QueryClientProvider>
  );
}
