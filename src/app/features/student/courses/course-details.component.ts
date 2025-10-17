import { Component, inject, signal, OnInit, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule, NgModel } from "@angular/forms";
import { AuthService } from "../../../core/services/auth.service";
import { ApiService } from "../../../core/services/api.service";

// Types
interface Teacher {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface Chapter {
  id: number;
  title: string;
  description: string;
  order: number;
  attachments: Attachment[];
  quiz: Quiz | null;
  progress: LessonProgress | null;
}

interface Attachment {
  id: number;
  title: string;
  file_type: string;
  file_url: string;
  source: string;
  description: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  passing_score: number;
  questions: QuizQuestion[];
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  order: number;
}

interface LessonProgress {
  completed: boolean;
  quiz_score: number | null;
  completed_at: string | null;
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

interface Note {
  id: number;
  title: string;
  content: string;
  chapter_id?: number;
  course_id?: number;
  created_at: string;
  updated_at: string;
}

interface CourseDetails {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  teacher?: Teacher;
  active_class?: {
    id: number;
    title: string;
    description: string;
  } | null;
  created_at: string;
  chapters: Chapter[];
  live_classes: LiveClass[];
}

@Component({
  selector: "app-course-details",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="course-container">
      <!-- Header -->
      <div class="course-header sticky-top bg-white shadow-sm">
        <div class="container-fluid py-3">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-3">
              <button
                class="btn btn-outline-secondary btn-sm"
                (click)="goBack()"
              >
                <i class="bi bi-arrow-left"></i>
              </button>
              <div>
                <h2 class="mb-0" *ngIf="courseDetails()">
                  {{ courseDetails()!.title }}
                </h2>
                <small class="text-muted" *ngIf="courseDetails()?.teacher">
                  Instructor: {{ courseDetails()!.teacher!.full_name }}
                </small>
              </div>
            </div>
            <button
              class="btn btn-outline-primary btn-sm"
              (click)="refreshCourse()"
            >
              <i class="bi bi-arrow-clockwise me-1"></i> Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2 text-muted">Loading course content...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading() && error()" class="alert alert-danger m-4">
        <i class="bi bi-exclamation-triangle me-2"></i>
        <strong>Error:</strong> {{ error() }}
        <button class="btn btn-sm btn-primary ms-2" (click)="refreshCourse()">
          Try Again
        </button>
      </div>

      <!-- Course Content -->
      <div *ngIf="!loading() && courseDetails()" class="container-fluid py-4">
        <!-- Course Overview -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h4 class="mb-0">{{ courseDetails()!.title }}</h4>
                <small class="text-muted" *ngIf="courseDetails()?.teacher">
                  Instructor: {{ courseDetails()!.teacher!.full_name }}
                </small>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-8">
                    <p class="mb-0">{{ courseDetails()!.description }}</p>
                  </div>
                  <div class="col-md-4">
                    <div class="progress mb-2" style="height: 10px;">
                      <div
                        class="progress-bar"
                        [style.width.%]="courseProgress()"
                        [class]="getProgressBarClass(courseProgress())"
                      ></div>
                    </div>
                    <small class="text-muted">
                      {{ courseProgress() }}% Complete ({{
                        completedChapters()
                      }}/{{ totalChapters() }} classes)
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Classes (Chapters) -->
        <div class="row g-4">
          <div
            *ngFor="let chapter of sortedChapters(); trackBy: trackByChapter"
            class="col-12"
          >
            <div
              class="card class-card"
              [class.active-class]="
                courseDetails()?.active_class?.id === chapter.id
              "
            >
              <div class="card-header bg-light">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="d-flex align-items-center gap-2">
                    <button
                      class="btn btn-sm btn-outline-secondary border-0 p-0 me-2"
                      (click)="toggleChapterCollapse(chapter.id)"
                      [attr.aria-expanded]="!isChapterCollapsed(chapter.id)"
                      [attr.aria-controls]="'chapter-content-' + chapter.id"
                    >
                      <i
                        class="bi"
                        [class]="
                          isChapterCollapsed(chapter.id)
                            ? 'bi-chevron-right'
                            : 'bi-chevron-down'
                        "
                      ></i>
                    </button>
                    <h5 class="mb-0">
                      <i class="bi bi-folder me-2"></i>
                      {{ chapter.title }}
                    </h5>
                    <span
                      *ngIf="courseDetails()?.active_class?.id === chapter.id"
                      class="badge bg-primary"
                    >
                      <i class="bi bi-play-circle me-1"></i>Active Class
                    </span>
                  </div>
                  <div class="d-flex align-items-center gap-2">
                    <!-- Class Progress -->
                    <div class="progress" style="width: 120px; height: 8px;">
                      <div
                        class="progress-bar"
                        [style.width.%]="getChapterProgress(chapter)"
                        [class]="
                          getChapterProgress(chapter) === 100
                            ? 'bg-success'
                            : 'bg-info'
                        "
                      ></div>
                    </div>
                    <small class="text-muted"
                      >{{ getChapterProgress(chapter) }}%</small
                    >
                    <span
                      class="badge"
                      [class]="
                        chapter.progress?.completed
                          ? 'bg-success'
                          : 'bg-secondary'
                      "
                    >
                      {{
                        chapter.progress?.completed
                          ? "✓ Completed"
                          : "In Progress"
                      }}
                    </span>
                  </div>
                </div>
                <small class="text-muted" *ngIf="chapter.description">
                  {{ chapter.description }}
                </small>
              </div>

              <div
                class="card-body collapse"
                [class.show]="!isChapterCollapsed(chapter.id)"
                [id]="'chapter-content-' + chapter.id"
              >
                <!-- Subjects Section -->
                <div class="card">
                  <div class="card-header">
                    <h6 class="mb-0">
                      <i class="bi bi-book me-2"></i>Subjects
                    </h6>
                  </div>
                  <div class="card-body">
                    <div *ngIf="chapter.attachments.length > 0" class="row g-3">
                      <div
                        *ngFor="
                          let attachment of chapter.attachments;
                          trackBy: trackByAttachment
                        "
                        class="col-12"
                      >
                        <div class="card subject-card border">
                          <div class="card-body">
                            <div class="row align-items-center">
                              <!-- Subject Info -->
                              <div class="col-md-6">
                                <h6 class="mb-1">
                                  <i class="bi bi-file-earmark me-2"></i>
                                  {{ attachment.title }}
                                </h6>
                                <small
                                  class="text-muted d-block"
                                  *ngIf="attachment.description"
                                >
                                  {{ attachment.description }}
                                </small>
                              </div>

                              <!-- Subject Actions -->
                              <div class="col-md-6">
                                <div class="d-flex gap-2 justify-content-end">
                                  <!-- Lesson Button -->
                                  <button
                                    class="btn btn-sm btn-outline-primary"
                                    (click)="openAttachment(attachment)"
                                    title="View Lesson"
                                  >
                                    <i class="bi bi-play-circle me-1"></i>Lesson
                                  </button>

                                  <!-- Notes Button -->
                                  <button
                                    class="btn btn-sm btn-outline-info"
                                    (click)="
                                      viewSubjectNotes(
                                        chapter.id,
                                        attachment.id
                                      )
                                    "
                                    title="View Notes"
                                  >
                                    <i class="bi bi-journal me-1"></i>Notes
                                  </button>

                                  <!-- Progress Indicator -->
                                  <div class="d-flex align-items-center">
                                    <small class="text-muted me-2"
                                      >Progress:</small
                                    >
                                    <span
                                      class="badge"
                                      [class]="
                                        chapter.progress?.completed
                                          ? 'bg-success'
                                          : 'bg-warning'
                                      "
                                    >
                                      {{
                                        chapter.progress?.completed
                                          ? "Completed"
                                          : "In Progress"
                                      }}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- Quiz Section (if available) -->
                            <div
                              *ngIf="
                                chapter.quiz && !chapter.progress?.completed
                              "
                              class="mt-3 pt-3 border-top"
                            >
                              <div
                                class="d-flex justify-content-between align-items-center"
                              >
                                <small class="text-muted">
                                  <i class="bi bi-question-circle me-1"></i>
                                  Assessment Available
                                </small>
                                <button
                                  class="btn btn-sm btn-warning"
                                  (click)="startQuizForChapter(chapter)"
                                >
                                  <i class="bi bi-play-circle me-1"></i>
                                  Take Quiz
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      *ngIf="chapter.attachments.length === 0"
                      class="text-center py-4"
                    >
                      <i
                        class="bi bi-book text-muted"
                        style="font-size: 2rem;"
                      ></i>
                      <p class="text-muted mt-2">
                        No subjects available for this class
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Class Calendar - Only for Active Class -->
                <div
                  class="card mt-3"
                  *ngIf="courseDetails()?.active_class?.id === chapter.id"
                >
                  <div class="card-header">
                    <h6 class="mb-0">
                      <i class="bi bi-calendar-week me-2"></i>Class Schedule
                    </h6>
                  </div>
                  <div class="card-body">
                    <div *ngIf="getChapterLiveClasses(chapter.id).length > 0">
                      <div class="row g-3">
                        <div
                          *ngFor="
                            let daySchedule of getChapterGroupedLiveClasses(
                              chapter.id
                            );
                            trackBy: trackByDate
                          "
                          class="col-md-6 col-lg-4"
                        >
                          <div class="card border-primary">
                            <div class="card-header bg-primary text-white">
                              <h6 class="mb-0">
                                <i class="bi bi-calendar-day me-2"></i>
                                {{ formatDayHeader(daySchedule.date) }}
                              </h6>
                            </div>
                            <div class="card-body">
                              <div
                                *ngFor="
                                  let liveClass of daySchedule.classes;
                                  trackBy: trackByLiveClass
                                "
                                class="mb-3 p-2 border rounded bg-light"
                              >
                                <div
                                  class="d-flex justify-content-between align-items-start"
                                >
                                  <div class="flex-grow-1">
                                    <small class="d-block">{{
                                      liveClass.title
                                    }}</small>
                                    <small class="text-muted">
                                      <i class="bi bi-clock me-1"></i>
                                      {{ liveClass.start_time }} -
                                      {{ liveClass.end_time }}
                                    </small>
                                  </div>
                                  <div class="ms-2">
                                    <button
                                      class="btn btn-xs btn-primary"
                                      *ngIf="
                                        liveClass.meeting_link &&
                                        isUpcoming(liveClass.scheduled_date)
                                      "
                                      (click)="
                                        window.open(
                                          liveClass.meeting_link,
                                          '_blank'
                                        )
                                      "
                                    >
                                      Join
                                    </button>
                                    <small
                                      class="badge d-block mt-1"
                                      [class]="
                                        isUpcoming(liveClass.scheduled_date)
                                          ? 'bg-info'
                                          : 'bg-secondary'
                                      "
                                    >
                                      {{
                                        isUpcoming(liveClass.scheduled_date)
                                          ? "Upcoming"
                                          : "Completed"
                                      }}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      *ngIf="getChapterLiveClasses(chapter.id).length === 0"
                      class="text-center py-4"
                    >
                      <i
                        class="bi bi-calendar-x text-muted"
                        style="font-size: 2rem;"
                      ></i>
                      <p class="text-muted mt-2">
                        No live sessions scheduled for this class
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- No Classes Message -->
          <div
            *ngIf="courseDetails()!.chapters.length === 0"
            class="text-center py-5"
          >
            <i class="bi bi-folder text-muted" style="font-size: 3rem;"></i>
            <h5 class="text-muted mt-3">No Classes Available</h5>
            <p class="text-muted">This course doesn't have any classes yet.</p>
          </div>
        </div>

        <!-- Video Modal -->
      </div>
    </div>
  `,
  styles: [
    `
      .course-container {
        min-height: 100vh;
        background-color: #f8f9fa;
      }

      .course-header {
        z-index: 100;
      }

      .tab-content {
        min-height: 400px;
      }

      .chapter-item {
        padding: 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .chapter-item:hover {
        background-color: #f0f0f0;
      }

      .chapter-item.active {
        background-color: #e3f2fd;
        border-left: 3px solid #0d6efd;
      }

      .video-card {
        transition: all 0.3s;
        border: 1px solid #e0e0e0;
      }

      .video-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .cursor-pointer {
        cursor: pointer;
      }

      .class-card {
        transition: all 0.3s;
      }

      .class-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .subject-card {
        transition: all 0.3s;
        border: 1px solid #e0e0e0;
      }

      .subject-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .progress-circle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
      }

      .video-container iframe {
        width: 100%;
        height: 600px;
        border: none;
      }

      .modal {
        z-index: 1050;
      }

      @media (max-width: 768px) {
        .course-container {
          padding: 1rem;
        }

        .col-lg-3 {
          margin-bottom: 2rem;
        }
      }
    `,
  ],
})
export class CourseDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  // Signals
  loading = signal(false);
  error = signal<string | null>(null);
  courseDetails = signal<CourseDetails | null>(null);
  selectedChapter = signal<Chapter | null>(null);
  courseProgress = signal(0);
  totalChapters = computed(() => this.courseDetails()?.chapters.length || 0);
  completedChapters = computed(
    () =>
      this.courseDetails()?.chapters.filter(
        (ch: Chapter) => ch.progress?.completed
      ).length || 0
  );

  // Sorted chapters with active class first
  sortedChapters = computed(() => {
    const chapters = this.courseDetails()?.chapters || [];
    const activeClassId = this.courseDetails()?.active_class?.id;

    if (!activeClassId) {
      return chapters;
    }

    // Sort chapters: active class first, then others by order
    return [...chapters].sort((a, b) => {
      if (a.id === activeClassId) return -1;
      if (b.id === activeClassId) return 1;
      return a.order - b.order;
    });
  });

  activeTab = signal<"lesson" | "notes" | "calendar">("lesson");
  showQuiz = signal(false);
  showVideoModal = signal(false);
  showNoteForm = signal(false);
  currentAttachment = signal<Attachment | null>(null);
  currentQuestionIndex = signal(0);
  quizAnswers = signal<number[]>([]);
  quizCompleted = signal(false);
  quizScore = signal(0);
  notes = signal<Note[]>([]);
  expandCalendar = false;
  newNote = {
    title: "",
    content: "",
    chapter_id: null as number | null,
  };

  // Track collapsed state for each chapter (non-active classes collapsed by default)
  collapsedChapters = signal<Map<number, boolean>>(new Map());

  window = window;

  ngOnInit(): void {
    const courseId = this.route.snapshot.params["id"];
    if (courseId) {
      this.loadCourseDetails(+courseId);
      this.loadNotes();
    }
  }

  isChapterCollapsed(chapterId: number): boolean {
    const activeClassId = this.courseDetails()?.active_class?.id;
    // Active class is always expanded, others are collapsed by default
    if (chapterId === activeClassId) {
      return false;
    }
    return this.collapsedChapters().get(chapterId) ?? true; // Default to collapsed
  }

  toggleChapterCollapse(chapterId: number): void {
    const currentMap = this.collapsedChapters();
    const newMap = new Map(currentMap);
    newMap.set(chapterId, !this.isChapterCollapsed(chapterId));
    this.collapsedChapters.set(newMap);
  }

  loadCourseDetails(courseId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getCourseDetails(courseId).subscribe({
      next: (data: CourseDetails) => {
        this.courseDetails.set(data);
        this.calculateCourseProgress(data);
        this.loading.set(false);

        // Auto-select first chapter if available
        if (data.chapters.length > 0) {
          this.selectChapter(data.chapters[0]);
        }
      },
      error: (error) => {
        console.error("Failed to load course details:", error);
        this.error.set("Failed to load course details. Please try again.");
        this.loading.set(false);
      },
    });
  }

  loadNotes(): void {
    const userId = this.authService.user()?.id;
    if (userId) {
      this.apiService.getStudentNotes(userId).subscribe({
        next: (notes: Note[]) => {
          this.notes.set(notes);
        },
        error: (error) => {
          console.error("Failed to load notes:", error);
        },
      });
    }
  }

  calculateCourseProgress(course: CourseDetails): void {
    if (course.chapters.length === 0) {
      this.courseProgress.set(0);
      return;
    }

    const completedChapters = course.chapters.filter(
      (ch) => ch.progress?.completed
    ).length;
    const progress = (completedChapters / course.chapters.length) * 100;
    this.courseProgress.set(Math.round(progress));
  }

  selectChapter(chapter: Chapter): void {
    this.selectedChapter.set(chapter);
    this.showQuiz.set(false);
    this.quizCompleted.set(false);
    this.currentQuestionIndex.set(0);
    this.quizAnswers.set(
      new Array(chapter.quiz?.questions.length || 0).fill(-1)
    );
  }

  startQuiz(): void {
    this.showQuiz.set(true);
    this.quizCompleted.set(false);
    this.currentQuestionIndex.set(0);
    this.quizAnswers.set(
      new Array(this.selectedChapter()!.quiz!.questions.length).fill(-1)
    );
  }

  restartQuiz(): void {
    this.startQuiz();
  }

  nextQuestion(): void {
    if (
      this.currentQuestionIndex() <
      this.selectedChapter()!.quiz!.questions.length - 1
    ) {
      this.currentQuestionIndex.update((idx) => idx + 1);
    } else {
      this.finishQuiz();
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update((idx) => idx - 1);
    }
  }

  finishQuiz(): void {
    const quiz = this.selectedChapter()!.quiz!;
    let correctAnswers = 0;

    quiz.questions.forEach((question, index) => {
      if (this.quizAnswers()[index] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    this.quizScore.set(score);
    this.quizCompleted.set(true);
  }

  completeLesson(): void {
    if (!this.selectedChapter() || !this.courseDetails()) return;

    this.apiService
      .completeLesson(
        this.courseDetails()!.id,
        this.selectedChapter()!.id,
        this.quizScore()
      )
      .subscribe({
        next: () => {
          this.loadCourseDetails(this.courseDetails()!.id);
          this.showQuiz.set(false);
          this.quizCompleted.set(false);
        },
        error: (error) => {
          console.error("Failed to complete lesson:", error);
        },
      });
  }

  getVideoAttachments(attachments: Attachment[]): Attachment[] {
    return attachments.filter((a) => a.file_type === "video");
  }

  openAttachment(attachment: Attachment): void {
    this.currentAttachment.set(attachment);
    if (attachment.file_type === "video") {
      this.showVideoModal.set(true);
    }
  }

  closeVideoModal(): void {
    this.showVideoModal.set(false);
    this.currentAttachment.set(null);
  }

  addNote(): void {
    if (!this.newNote.title || !this.newNote.content) {
      alert("Please fill in title and content");
      return;
    }

    const userId = this.authService.user()?.id;
    if (!userId) return;

    this.apiService
      .createNote(
        userId,
        this.newNote.title,
        this.newNote.content,
        this.courseDetails()!.id
      )
      .subscribe({
        next: () => {
          this.newNote = { title: "", content: "", chapter_id: null };
          this.showNoteForm.set(false);
          this.loadNotes();
        },
        error: (error) => {
          console.error("Failed to create note:", error);
        },
      });
  }

  editNote(note: Note): void {
    this.newNote = {
      title: note.title,
      content: note.content,
      chapter_id: note.chapter_id || null,
    };
    this.showNoteForm.set(true);
  }

  deleteNote(noteId: number): void {
    if (confirm("Are you sure you want to delete this note?")) {
      const userId = this.authService.user()?.id;
      if (!userId) return;

      this.apiService.deleteNote(userId, noteId).subscribe({
        next: () => {
          this.loadNotes();
        },
        error: (error) => {
          console.error("Failed to delete note:", error);
        },
      });
    }
  }

  upcomingClasses = computed(() => {
    const now = new Date();
    return (
      this.courseDetails()
        ?.live_classes.filter((lc) => new Date(lc.scheduled_date) > now)
        .slice(0, 3) || []
    );
  });

  getChapterNameById(chapterId: number | null): string {
    if (!chapterId) return "";
    return (
      this.courseDetails()?.chapters.find((ch) => ch.id === chapterId)?.title ||
      ""
    );
  }

  isUpcoming(scheduledDate: string): boolean {
    return new Date(scheduledDate) > new Date();
  }

  getVideoEmbedUrl(url: string): string {
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  }

  getProgressBarClass(progress: number): string {
    if (progress >= 80) return "bg-success";
    if (progress >= 50) return "bg-warning";
    return "bg-info";
  }

  goBack(): void {
    this.router.navigate(["/student/courses"]);
  }

  refreshCourse(): void {
    if (this.courseDetails()) {
      this.loadCourseDetails(this.courseDetails()!.id);
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  formatSessionDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  trackByChapter(index: number, chapter: Chapter): number {
    return chapter.id;
  }

  trackByAttachment(index: number, attachment: Attachment): number {
    return attachment.id;
  }

  trackByQuestion(index: number, question: QuizQuestion): number {
    return question.id;
  }

  trackByOption(index: number, option: string): number {
    return index;
  }

  trackByNote(index: number, note: Note): number {
    return note.id;
  }

  trackByLiveClass(index: number, liveClass: LiveClass): number {
    return liveClass.id;
  }

  // Get live classes for a specific chapter
  getChapterLiveClasses(chapterId: number): LiveClass[] {
    return (
      this.courseDetails()?.live_classes.filter(
        (liveClass) => liveClass.chapter_id === chapterId
      ) || []
    );
  }

  // Get grouped live classes for a specific chapter
  getChapterGroupedLiveClasses(
    chapterId: number
  ): { date: string; classes: LiveClass[] }[] {
    const chapterLiveClasses = this.getChapterLiveClasses(chapterId);

    // Group by date
    const grouped = chapterLiveClasses.reduce((acc, liveClass) => {
      const date = liveClass.scheduled_date.split("T")[0]; // Get date part only
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(liveClass);
      return acc;
    }, {} as Record<string, LiveClass[]>);

    // Convert to array and sort by date
    return Object.entries(grouped)
      .map(([date, classes]) => ({ date, classes }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  viewSubjectNotes(chapterId: number, attachmentId: number): void {
    // Filter notes for this specific chapter and course
    const courseId = this.courseDetails()?.id;
    const subjectNotes = this.notes().filter(
      (note) => note.chapter_id === chapterId && note.course_id === courseId
    );

    // For now, just show an alert. In a full implementation, you might want to show a modal or navigate to a notes view
    if (subjectNotes.length > 0) {
      const noteTitles = subjectNotes.map((note) => note.title).join(", ");
      alert(`Notes for this subject: ${noteTitles}`);
    } else {
      alert(
        "No notes available for this subject. Create some notes in the Notes tab."
      );
    }
  }

  startQuizForChapter(chapter: Chapter): void {
    this.selectedChapter.set(chapter);
    this.startQuiz();
  }

  // Course-level calendar methods
  getGroupedLiveClasses(): { date: string; classes: LiveClass[] }[] {
    const liveClasses = this.courseDetails()?.live_classes || [];
    const activeClassId = this.courseDetails()?.active_class?.id;

    // Filter to only show live classes for the active class
    const filteredClasses = activeClassId
      ? liveClasses.filter(
          (liveClass) => liveClass.chapter_id === activeClassId
        )
      : [];

    // Group by date
    const grouped = filteredClasses.reduce((acc, liveClass) => {
      const date = liveClass.scheduled_date.split("T")[0]; // Get date part only
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(liveClass);
      return acc;
    }, {} as Record<string, LiveClass[]>);

    // Convert to array and sort by date
    return Object.entries(grouped)
      .map(([date, classes]) => ({ date, classes }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  trackByDate(
    index: number,
    daySchedule: { date: string; classes: LiveClass[] }
  ): string {
    return daySchedule.date;
  }

  formatDayHeader(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  }

  // Calculate chapter progress based on completed subjects
  getChapterProgress(chapter: Chapter): number {
    if (!chapter.attachments || chapter.attachments.length === 0) {
      return chapter.progress?.completed ? 100 : 0;
    }

    // For now, we'll consider the chapter complete if the chapter.progress.completed is true
    // In a more detailed implementation, you could track individual attachment progress
    return chapter.progress?.completed ? 100 : 0;
  }
}
