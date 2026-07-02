'use client'

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

// Thin client wrapper so server layouts can mount next-themes. The public site
// stays light-only (no provider there); this is mounted under /admin, where the
// injected pre-paint script toggles `.dark` on <html> before hydration.
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
