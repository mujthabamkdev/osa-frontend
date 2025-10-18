import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { Course } from '../../../core/models/course.models';
import {
  StudentProgress,
  StudentStats,
  EnrolledCourse,
  Note,
} from '../../../core/models/dashboard.models';

@Component({
  templateUrl: './student-dashboard.component.html',
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class StudentDashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly apiService = inject(ApiService);
  readonly router = inject(Router);

  // Signals for reactive state
  readonly loading = signal(false);
  readonly stats = signal<StudentStats>({
    enrolledCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalProgress: 0,
    hoursStudied: 0,
  });
  readonly enrolledCourses = signal<EnrolledCourse[]>([]);
  readonly recentProgress = signal<StudentProgress[]>([]);
  readonly notes = signal<Note[]>([]);
  readonly showNotesModal = signal(false);
  readonly selectedNote = signal<Note | null>(null);
  readonly noteTitle = signal('');
  readonly noteContent = signal('');

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading.set(true);
    const user = this.authService.user();
    if (!user) return;

    // Load enrolled courses with levels
    this.apiService.getEnrolledCourses(user.id).subscribe({
      next: async (progressData: StudentProgress[]) => {
        const enrolledCourses: EnrolledCourse[] = [];

        for (const progress of progressData) {
          const course: EnrolledCourse = {
            id: progress.course_id,
            title: progress.course_title || progress.title || 'Course',
            description: `Course with ${progress.total_lessons || 0} lessons`,
            progress: progress.progress,
            status: this.getCourseStatus(progress.progress),
            lastAccessed: progress.last_accessed,
            instructor: 'Instructor Name', // Mock instructor
            active_class_id: progress.active_class_id,
            active_class_title: progress.active_class_title,
          };

          // Load course levels/chapters
          try {
            const levels = await this.apiService.getCourseLevels(progress.course_id).toPromise();
            if (levels && levels.length > 0) {
              course.levels = levels.map((level: any) => ({
                id: level.id,
                course_id: level.course_id,
                title: level.title,
                description: level.description,
                order: level.order,
                progress: 0, // Will be calculated based on completed classes
                created_at: level.created_at,
              }));

              // Calculate level progress (mock for now)
              course.totalLevels = course.levels.length;
              course.completedLevels = Math.floor((course.progress / 100) * course.levels.length);
            } else {
              course.levels = [];
              course.totalLevels = 0;
              course.completedLevels = 0;
            }
          } catch (error) {
            console.warn(`Failed to load levels for course ${progress.course_id}:`, error);
            course.levels = [];
            course.totalLevels = 0;
            course.completedLevels = 0;
          }

          enrolledCourses.push(course);
        }

        this.enrolledCourses.set(enrolledCourses);

        // Calculate stats
        const completed = enrolledCourses.filter((c) => c.status === 'completed').length;
        const inProgress = enrolledCourses.filter((c) => c.status === 'in-progress').length;
        const totalProgress =
          enrolledCourses.length > 0
            ? Math.round(
                enrolledCourses.reduce((sum, c) => sum + c.progress, 0) / enrolledCourses.length
              )
            : 0;

        this.stats.set({
          enrolledCourses: enrolledCourses.length,
          completedCourses: completed,
          inProgressCourses: inProgress,
          totalProgress,
          hoursStudied: Math.floor(Math.random() * 50) + 10, // Mock hours
        });

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load enrolled courses:', error);
        this.loading.set(false);
      },
    });

    // Load recent progress (mock data for now)
    this.apiService.getStudentProgress(user.id).subscribe({
      next: (progress: StudentProgress[]) => {
        this.recentProgress.set(progress.slice(0, 5)); // Show last 5 activities
      },
      error: (error) => {
        console.error('Failed to load progress:', error);
        // Set mock progress data
        this.recentProgress.set([
          {
            course_id: 1,
            course_title: 'Introduction to Islamic Studies',
            progress: 75,
            completed_lessons: 15,
            total_lessons: 20,
            last_accessed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          {
            course_id: 2,
            course_title: 'Quran Recitation Basics',
            progress: 45,
            completed_lessons: 9,
            total_lessons: 20,
            last_accessed: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      },
    });

    // Load student notes
    this.apiService.getStudentNotes(user.id).subscribe({
      next: (notes: Note[]) => {
        this.notes.set(notes);
      },
      error: (error) => {
        console.error('Failed to load notes:', error);
        this.notes.set([]);
      },
    });
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  viewAllCourses(): void {
    this.router.navigate(['/']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  viewMyCourses(): void {
    this.router.navigate(['/student/courses']);
  }

  viewProgress(): void {
    // Could navigate to a detailed progress page
    this.router.navigate(['/student/courses']);
  }

  viewCourse(courseId: number): void {
    // Navigate to course details page to continue learning
    this.router.navigate(['/student/courses', courseId]);
  }

  isCourseAccessible(course: EnrolledCourse): boolean {
    // Allow access to courses that have an active class (current courses)
    // or courses that are in progress or completed
    // Disable access to courses that are not started and have no active class
    return !!course.active_class_title || course.status !== 'not-started';
  }

  enrollInCourse(courseId: number): void {
    const user = this.authService.user();
    if (!user) return;

    this.apiService.enrollInCourse(courseId).subscribe({
      next: () => {
        // Refresh dashboard data to update enrolled courses
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Failed to enroll in course:', error);
      },
    });
  }

  // Notes functionality
  openNotesModal(note?: Note): void {
    if (note) {
      this.selectedNote.set(note);
      this.noteTitle.set(note.title);
      this.noteContent.set(note.content);
    } else {
      this.selectedNote.set(null);
      this.noteTitle.set('');
      this.noteContent.set('');
    }
    this.showNotesModal.set(true);
  }

  closeNotesModal(): void {
    this.showNotesModal.set(false);
    this.selectedNote.set(null);
    this.noteTitle.set('');
    this.noteContent.set('');
  }

  saveNote(): void {
    const user = this.authService.user();
    if (!user) return;

    const title = this.noteTitle().trim();
    const content = this.noteContent().trim();

    if (!title || !content) return;

    if (this.selectedNote()) {
      // Update existing note
      this.apiService.updateNote(user.id, this.selectedNote()!.id, title, content).subscribe({
        next: () => {
          this.loadDashboardData();
          this.closeNotesModal();
        },
        error: (error) => {
          console.error('Failed to update note:', error);
        },
      });
    } else {
      // Create new note
      this.apiService.createNote(user.id, title, content).subscribe({
        next: () => {
          this.loadDashboardData();
          this.closeNotesModal();
        },
        error: (error) => {
          console.error('Failed to create note:', error);
        },
      });
    }
  }

  deleteNote(noteId: number): void {
    const user = this.authService.user();
    if (!user) return;

    if (confirm('Are you sure you want to delete this note?')) {
      this.apiService.deleteNote(user.id, noteId).subscribe({
        next: () => {
          this.loadDashboardData();
        },
        error: (error) => {
          console.error('Failed to delete note:', error);
        },
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getCourseStatus(progress: number): 'not-started' | 'in-progress' | 'completed' {
    if (progress === 0) return 'not-started';
    if (progress === 100) return 'completed';
    return 'in-progress';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'in-progress':
        return 'bg-warning';
      case 'not-started':
        return 'bg-secondary';
      default:
        return 'bg-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'not-started':
        return 'Not Started';
      default:
        return 'Unknown';
    }
  }

  getProgressBarClass(progress: number): string {
    if (progress >= 80) return 'bg-success';
    if (progress >= 50) return 'bg-warning';
    return 'bg-info';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }
}
