import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly isLoading = signal(false);
  private loadingCount = 0;

  readonly loading = this.isLoading.asReadonly();

  show(): void {
    this.loadingCount++;
    this.isLoading.set(true);
  }

  hide(): void {
    this.loadingCount = Math.max(0, this.loadingCount - 1);
    if (this.loadingCount === 0) {
      this.isLoading.set(false);
    }
  }

  reset(): void {
    this.loadingCount = 0;
    this.isLoading.set(false);
  }
}