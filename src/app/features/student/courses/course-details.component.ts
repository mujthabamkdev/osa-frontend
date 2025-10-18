import { Component, inject, signal, OnInit, computed, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

// Types
interface Teacher {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Attachment {
  id: number;
  title: string;
  file_type: string;
  file_url: string;
  source: string;
  description: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  order: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  passing_score: number;
  questions: QuizQuestion[];
}

interface LessonProgress {
  completed: boolean;
  quiz_score: number | null;
  completed_at: string | null;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  order: number;
  subject_id: number;
  subject_name: string;
  attachments: Attachment[];
  quiz: Quiz | null;
  progress: LessonProgress | null;
}

interface Subject {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface DaySchedule {
  date: string; // "2025-10-18"
  dateObj: Date;
  lessons: Lesson[]; // Lessons for this day, grouped by subject
}

interface LiveClass {
  id: number;
  title: string;
  description: string;
  chapter_id: number | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
}

interface CourseDetails {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  teacher?: Teacher;
  created_at: string;
  subjects: Subject[];
  schedule: DaySchedule[];
  live_classes: LiveClass[];
}

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.css',
})
export class CourseDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  courseDetails = signal<CourseDetails | null>(null);
  selectedLesson = signal<Lesson | null>(null);

  collapsedSubjects = signal<Map<number, boolean>>(new Map());

  ngOnInit(): void {
    const courseId = this.route.snapshot.params['id'];
    if (courseId) {
      this.loadCourseDetails(+courseId);
    }
  }

  loadCourseDetails(courseId: number): void {
    this.loading.set(true);
    this.error.set(null);
    console.log('Loading course details for id:', courseId);
    this.apiService
      .getCourseDetails(courseId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          console.log('Course details request completed, setting loading to false');
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (rawData: any) => {
          console.log('Course details API response:', rawData);

          // Transform backend data structure to match frontend expectations
          const data = this.transformCourseData(rawData);
          console.log('Course details transformed:', data);

          this.courseDetails.set(data);
        },
        error: (error) => {
          console.error('Failed to load course details:', error);
          this.error.set('Failed to load course details. Please try again.');
        },
      });
  }

  private transformCourseData(rawData: any): CourseDetails {
    console.log('Transforming course data...', rawData);

    const subjects: Subject[] = [];
    const schedule: DaySchedule[] = [];

    // Build subjects with lessons from classes structure
    if (rawData.classes && Array.isArray(rawData.classes)) {
      console.log('Processing classes structure...');

      for (const classObj of rawData.classes) {
        if (classObj.subjects && Array.isArray(classObj.subjects)) {
          for (const subject of classObj.subjects) {
            const lessons: Lesson[] = [];

            // Transform sessions into lessons
            if (subject.sessions && Array.isArray(subject.sessions)) {
              // Sort sessions by order first
              const sortedSessions = subject.sessions.sort(
                (a: any, b: any) => (a.order || 0) - (b.order || 0)
              );

              // Create lessons with "Day X" naming
              sortedSessions.forEach((session: any, dayIndex: number) => {
                const dayNumber = dayIndex + 1; // Day 1, Day 2, etc.
                const lesson: Lesson = {
                  id: session.id || Math.random(),
                  title: `Day ${dayNumber}`, // Renamed to Day 1, Day 2, etc.
                  description: session.description || session.title || '', // Use session title as description
                  order: session.order || dayIndex,
                  subject_id: subject.id,
                  subject_name: subject.name || 'Subject',
                  attachments: (session.contents || []).map((content: any, idx: number) => ({
                    id: content.id || idx,
                    title: content.title || 'Content',
                    file_type: content.content_type || 'document',
                    file_url: content.file_url || '',
                    source: content.source || 'upload',
                    description: content.description || '',
                  })),
                  quiz: session.quiz || null,
                  progress: session.progress || null,
                };
                lessons.push(lesson);
              });
            }

            subjects.push({
              id: subject.id,
              title: subject.name || 'Untitled Subject',
              description: subject.description || '',
              order: subject.order_in_class || 0,
              lessons: lessons,
            });
          }
        }
      }
    }

    const result: CourseDetails = {
      id: rawData.id,
      title: rawData.title,
      description: rawData.description,
      teacher_id: rawData.teacher_id,
      teacher: rawData.teacher,
      created_at: rawData.created_at,
      subjects,
      schedule,
      live_classes: rawData.live_classes || [],
    };

    console.log('Transformation complete. Subjects:', subjects.length);
    console.log('Subjects with lessons:', subjects);
    return result;
  }

  selectLesson(lesson: Lesson): void {
    this.selectedLesson.set(lesson);
  }

  isActiveLessonId(lessonId: number): boolean {
    return this.selectedLesson()?.id === lessonId;
  }

  toggleSubject(subjectId: number): void {
    const currentMap = this.collapsedSubjects();
    const newMap = new Map(currentMap);
    newMap.set(subjectId, !this.isSubjectCollapsed(subjectId));
    this.collapsedSubjects.set(newMap);
  }

  isSubjectCollapsed(subjectId: number): boolean {
    return this.collapsedSubjects().get(subjectId) ?? true;
  }

  goBack(): void {
    this.router.navigate(['/student/courses']);
  }

  refreshCourse(): void {
    if (this.courseDetails()) {
      this.loadCourseDetails(this.courseDetails()!.id);
    }
  }
}
