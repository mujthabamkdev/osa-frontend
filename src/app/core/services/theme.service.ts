import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly isBrowser = typeof window !== 'undefined';
  private readonly systemPreference = this.isBrowser
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  private readonly currentTheme = signal<Theme>(this.loadInitialTheme());

  readonly theme = this.currentTheme.asReadonly();

  constructor() {
    if (this.systemPreference) {
      this.systemPreference.addEventListener('change', this.handleSystemPreferenceChange);
    }

    effect(() => {
      const activeTheme = this.currentTheme();
      if (!this.isBrowser) {
        return;
      }

      localStorage.setItem('theme', activeTheme);
      this.applyTheme(activeTheme);
    });
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  toggleTheme(): void {
    const current = this.currentTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
  }

  private loadInitialTheme(): Theme {
    if (!this.isBrowser) {
      return 'auto';
    }

    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored === 'light' || stored === 'dark' || stored === 'auto') {
      return stored;
    }

    return 'auto';
  }

  private handleSystemPreferenceChange = (): void => {
    if (this.currentTheme() === 'auto') {
      this.applyTheme('auto');
    }
  };

  private applyTheme(theme: Theme): void {
    if (!this.isBrowser) {
      return;
    }

    const root = document.documentElement;
    const resolvedTheme = this.resolveTheme(theme);

    root.setAttribute('data-color-scheme', resolvedTheme);
  }

  private resolveTheme(theme: Theme): 'light' | 'dark' {
    if (theme === 'auto') {
      return this.systemPreference?.matches ? 'dark' : 'light';
    }
    return theme;
  }
}
