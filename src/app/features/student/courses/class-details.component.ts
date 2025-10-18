import { Component, inject, signal, OnInit, computed, DestroyRef } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { finalize } from "rxjs";
import { AuthService } from "../../../core/services/auth.service";
import { ApiService } from "../../../core/services/api.service";

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
  date: string;
  dateObj: Date;
  lessons: Lesson[];
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
  selector: "app-class-details",
  standalone: true,
  imports: [FormsModule],
  templateUrl: './class-details.component.html',
  styleUrl: './class-details.component.css'
})
export class ClassDetailsComponent implements OnInit {
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
  viewMode = signal<'calendar' | 'subject'>('calendar');

  collapsedSubjects = signal<Map<number, boolean>>(new Map());

  ngOnInit(): void {
    const courseId = this.route.snapshot.params["id"];
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

          // Auto-select first lesson if available
          const firstScheduledDay = data.schedule?.[0];
          if (firstScheduledDay && firstScheduledDay.lessons.length > 0) {
            this.selectLesson(firstScheduledDay.lessons[0]);
          }
        },
        error: (error) => {
          console.error("Failed to load course details:", error);
          this.error.set("Failed to load course details. Please try again.");
        }
      });
  }

  private transformCourseData(rawData: any): CourseDetails {
    console.log('Transforming course data...', rawData);

    const subjects: Subject[] = [];
    const schedule: DaySchedule[] = [];
    const lessonMap = new Map<number, Lesson>();

    // First, build subjects with lessons from classes structure
    if (rawData.classes && Array.isArray(rawData.classes)) {
      console.log('Processing classes structure...');
      
      for (const classObj of rawData.classes) {
        if (classObj.subjects && Array.isArray(classObj.subjects)) {
          for (const subject of classObj.subjects) {
            const lessons: Lesson[] = [];

            // Transform sessions into lessons
            if (subject.sessions && Array.isArray(subject.sessions)) {
              for (const session of subject.sessions) {
                const lesson: Lesson = {
                  id: session.id || Math.random(),
                  title: session.title || 'Untitled Lesson',
                  description: session.description || '',
                  order: session.order || 0,
                  subject_id: subject.id,
                  subject_name: subject.name || 'Subject',
                  attachments: (session.contents || []).map((content: any, idx: number) => ({
                    id: content.id || idx,
                    title: content.title || 'Content',
                    file_type: content.content_type || 'document',
                    file_url: content.file_url || '',
                    source: content.source || 'upload',
                    description: content.description || ''
                  })),
                  quiz: session.quiz || null,
                  progress: session.progress || null
                };
                lessons.push(lesson);
                lessonMap.set(lesson.id, lesson);
              }
            }

            subjects.push({
              id: subject.id,
              title: subject.name || 'Untitled Subject',
              description: subject.description || '',
              order: subject.order_in_class || 0,
              lessons: lessons.sort((a, b) => a.order - b.order)
            });
          }
        }
      }
    }

    // Build daily schedule from live_classes
    if (rawData.live_classes && Array.isArray(rawData.live_classes)) {
      console.log('Building daily schedule from live_classes...');
      
      const dayMap = new Map<string, Lesson[]>();

      for (const liveClass of rawData.live_classes) {
        const dateStr = this.extractDate(liveClass.scheduled_date);
        
        // Find the corresponding lesson
        const lesson = lessonMap.get(liveClass.chapter_id);
        if (lesson) {
          if (!dayMap.has(dateStr)) {
            dayMap.set(dateStr, []);
          }
          dayMap.get(dateStr)!.push(lesson);
        }
      }

      // Convert map to sorted schedule array
      const sortedDates = Array.from(dayMap.keys()).sort();
      for (const dateStr of sortedDates) {
        schedule.push({
          date: dateStr,
          dateObj: new Date(dateStr),
          lessons: dayMap.get(dateStr) || []
        });
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
      live_classes: rawData.live_classes || []
    };

    console.log('Transformation complete. Subjects:', subjects.length, 'Schedule days:', schedule.length);
    return result;
  }

  private extractDate(dateString: string): string {
    // Extract just the date part (YYYY-MM-DD)
    return dateString.split('T')[0];
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

  formatDayHeader(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
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
