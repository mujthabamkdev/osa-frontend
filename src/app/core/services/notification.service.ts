// src/app/core/services/notification.service.ts
import { Injectable, signal } from "@angular/core";

export interface Notification {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);

  add(notification: Notification) {
    this.notifications.update((n) => [...n, notification]);
    setTimeout(() => this.remove(notification.id), 5000); // Auto-remove after 5 seconds
  }

  remove(id: number) {
    this.notifications.update((n) =>
      n.filter((notification) => notification.id !== id)
    );
  }

  allNotifications() {
    return this.notifications();
  }

  // Add these methods to match the interceptor calls
  error(message: string) {
    this.add({
      id: Date.now(),
      type: "error",
      message,
    });
  }

  success(message: string) {
    this.add({
      id: Date.now(),
      type: "success",
      message,
    });
  }

  warning(message: string) {
    this.add({
      id: Date.now(),
      type: "warning",
      message,
    });
  }

  info(message: string) {
    this.add({
      id: Date.now(),
      type: "info",
      message,
    });
  }

  // Keep the old methods for backward compatibility
  showError(message: string) {
    this.error(message);
  }

  showSuccess(message: string) {
    this.success(message);
  }

  // Clear all notifications
  clear() {
    this.notifications.set([]);
  }
}
