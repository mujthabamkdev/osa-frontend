import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly currentTheme = signal<Theme>('auto');
  
  readonly theme = this.currentTheme.asReadonly();

  constructor() {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      this.currentTheme.set(savedTheme);
    }

    // Apply theme changes
    effect(() => {
      this.applyTheme(this.currentTheme());
    });
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    localStorage.setItem('theme', theme);
  }

  toggleTheme(): void {
    const current = this.currentTheme();
    const next = current === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light-theme', 'dark-theme');
    
    if (theme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark-theme' : 'light-theme');
    } else {
      root.classList.add(`${theme}-theme`);
    }
  }
}