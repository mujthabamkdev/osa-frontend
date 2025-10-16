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
        <div class="row g-4">
          <!-- Left Sidebar: Navigation & Progress -->
          <div class="col-lg-3">
            <!-- Course Progress Card -->
            <div class="card mb-4">
              <div class="card-header">
                <h6 class="mb-0">Course Progress</h6>
              </div>
              <div class="card-body">
                <div class="progress mb-2" style="height: 10px;">
                  <div
                    class="progress-bar"
                    [style.width.%]="courseProgress()"
                    [class]="getProgressBarClass(courseProgress())"
                  ></div>
                </div>
                <small class="text-muted">
                  {{ courseProgress() }}% Complete ({{ completedChapters() }}/{{
                    totalChapters()
                  }}
                  lessons)
                </small>
              </div>
            </div>

            <!-- Chapters Navigation -->
            <div class="card mb-4">
              <div class="card-header">
                <h6 class="mb-0">Subjects</h6>
              </div>
              <div class="list-group list-group-flush">
                <button
                  *ngFor="
                    let chapter of courseDetails()!.chapters;
                    trackBy: trackByChapter
                  "
                  type="button"
                  class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                  [class.active]="selectedChapter()?.id === chapter.id"
                  (click)="selectChapter(chapter)"
                >
                  <div class="text-start flex-grow-1">
                    <small class="fw-medium d-block">{{ chapter.title }}</small>
                    <small class="text-muted">
                      <i
                        class="bi"
                        [class]="
                          chapter.progress?.completed
                            ? 'bi-check-circle-fill text-success'
                            : 'bi-clock text-warning'
                        "
                      ></i>
                      {{
                        chapter.progress?.completed
                          ? "Completed"
                          : "In Progress"
                      }}
                    </small>
                  </div>
                </button>
              </div>
            </div>

            <!-- Upcoming Classes -->
            <div class="card" *ngIf="upcomingClasses().length > 0">
              <div class="card-header">
                <h6 class="mb-0">Upcoming Sessions</h6>
              </div>
              <div class="card-body p-0">
                <div
                  *ngFor="let liveClass of upcomingClasses(); let first = first"
                  [class]="first ? 'p-3 border-bottom' : 'p-3 border-bottom'"
                  (click)="expandCalendar = !expandCalendar"
                  class="cursor-pointer hover-light"
                >
                  <small class="fw-medium d-block">{{ liveClass.title }}</small>
                  <small class="text-muted">
                    <i class="bi bi-calendar-event"></i>
                    {{ formatSessionDate(liveClass.scheduled_date) }}
                  </small>
                  <small class="text-muted d-block">
                    <i class="bi bi-clock"></i>
                    {{ liveClass.start_time }} - {{ liveClass.end_time }}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="col-lg-9">
            <!-- Tab Navigation -->
            <ul class="nav nav-tabs mb-4" role="tablist">
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link"
                  [class.active]="activeTab() === 'lesson'"
                  (click)="activeTab.set('lesson')"
                  type="button"
                >
                  <i class="bi bi-book me-2"></i>Lesson
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link"
                  [class.active]="activeTab() === 'notes'"
                  (click)="activeTab.set('notes')"
                  type="button"
                >
                  <i class="bi bi-journal me-2"></i>Notes
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button
                  class="nav-link"
                  [class.active]="activeTab() === 'calendar'"
                  (click)="activeTab.set('calendar')"
                  type="button"
                >
                  <i class="bi bi-calendar me-2"></i>Calendar
                </button>
              </li>
            </ul>

            <!-- LESSON TAB -->
            <div *ngIf="activeTab() === 'lesson'" class="tab-content">
              <div *ngIf="selectedChapter()" class="card">
                <div class="card-header">
                  <div
                    class="d-flex justify-content-between align-items-center"
                  >
                    <h5 class="mb-0">{{ selectedChapter()!.title }}</h5>
                    <span
                      class="badge"
                      [class]="
                        selectedChapter()!.progress?.completed
                          ? 'bg-success'
                          : 'bg-secondary'
                      "
                    >
                      {{
                        selectedChapter()!.progress?.completed
                          ? "✓ Completed"
                          : "In Progress"
                      }}
                    </span>
                  </div>
                </div>
                <div class="card-body">
                  <p class="text-muted" *ngIf="selectedChapter()!.description">
                    {{ selectedChapter()!.description }}
                  </p>

                  <!-- Video Player Section -->
                  <div
                    *ngIf="selectedChapter()!.attachments.length > 0"
                    class="mb-4"
                  >
                    <h6 class="mb-3">📹 Recorded Lectures</h6>
                    <div class="row g-3">
                      <div
                        *ngFor="
                          let attachment of getVideoAttachments(
                            selectedChapter()!.attachments
                          );
                          trackBy: trackByAttachment
                        "
                        class="col-md-6"
                      >
                        <div
                          class="card video-card cursor-pointer"
                          (click)="openAttachment(attachment)"
                        >
                          <div class="card-body">
                            <div class="d-flex align-items-start gap-2">
                              <i
                                class="bi bi-play-circle-fill fs-5 text-danger"
                              ></i>
                              <div class="flex-grow-1">
                                <h6 class="card-title mb-1">
                                  {{ attachment.title }}
                                </h6>
                                <small class="text-muted d-block">
                                  {{ attachment.description }}
                                </small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Quiz Section -->
                  <div
                    *ngIf="
                      selectedChapter()!.quiz &&
                      !selectedChapter()!.progress?.completed
                    "
                    class="card border-warning mb-4"
                  >
                    <div class="card-header bg-warning-subtle">
                      <h6 class="mb-0">
                        <i class="bi bi-question-circle me-2"></i>
                        Assessment: {{ selectedChapter()!.quiz!.title }}
                      </h6>
                    </div>
                    <div class="card-body">
                      <p class="text-muted mb-3">
                        {{
                          selectedChapter()!.quiz!.description ||
                            "Complete this quiz to mark the lesson as done"
                        }}
                      </p>
                      <small class="text-muted d-block mb-3">
                        Passing Score:
                        {{ selectedChapter()!.quiz!.passing_score }}% | Total
                        Questions:
                        {{ selectedChapter()!.quiz!.questions.length }}
                      </small>

                      <button
                        class="btn btn-warning"
                        (click)="startQuiz()"
                        [disabled]="showQuiz()"
                      >
                        <i class="bi bi-play-circle me-1"></i>
                        Start Quiz (4 Questions)
                      </button>
                    </div>
                  </div>

                  <!-- Quiz Interface -->
                  <div
                    *ngIf="showQuiz() && selectedChapter()!.quiz"
                    class="card"
                  >
                    <div class="card-header">
                      <div class="d-flex justify-content-between">
                        <h6 class="mb-0">
                          Quiz: {{ selectedChapter()!.quiz!.title }}
                        </h6>
                        <small class="text-muted">
                          Question {{ currentQuestionIndex() + 1 }} of
                          {{ selectedChapter()!.quiz!.questions.length }}
                        </small>
                      </div>
                    </div>
                    <div class="card-body">
                      <div *ngIf="!quizCompleted()">
                        <div
                          *ngFor="
                            let question of selectedChapter()!.quiz!.questions;
                            let i = index
                          "
                          [hidden]="i !== currentQuestionIndex()"
                        >
                          <div class="mb-4">
                            <h6 class="mb-3">{{ question.question }}</h6>
                            <div class="options">
                              <div
                                *ngFor="
                                  let option of question.options;
                                  let j = index;
                                  trackBy: trackByOption
                                "
                                class="form-check mb-2"
                              >
                                <input
                                  class="form-check-input"
                                  type="radio"
                                  [name]="'question-' + i"
                                  [id]="'option-' + i + '-' + j"
                                  [value]="j"
                                  [(ngModel)]="quizAnswers()[i]"
                                />
                                <label
                                  class="form-check-label"
                                  [for]="'option-' + i + '-' + j"
                                >
                                  {{ option }}
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="d-flex justify-content-between mt-4">
                          <button
                            class="btn btn-outline-secondary"
                            (click)="previousQuestion()"
                            [disabled]="currentQuestionIndex() === 0"
                          >
                            <i class="bi bi-chevron-left me-1"></i> Previous
                          </button>
                          <div
                            class="progress flex-grow-1 mx-3"
                            style="height: 8px;"
                          >
                            <div
                              class="progress-bar"
                              [style.width.%]="
                                ((currentQuestionIndex() + 1) /
                                  selectedChapter()!.quiz!.questions.length) *
                                100
                              "
                            ></div>
                          </div>
                          <button
                            class="btn btn-primary"
                            (click)="nextQuestion()"
                            [disabled]="
                              currentQuestionIndex() >=
                              selectedChapter()!.quiz!.questions.length - 1
                            "
                          >
                            {{
                              currentQuestionIndex() >=
                              selectedChapter()!.quiz!.questions.length - 1
                                ? "Finish"
                                : "Next"
                            }}
                            <i class="bi bi-chevron-right ms-1"></i>
                          </button>
                        </div>
                      </div>

                      <!-- Quiz Results -->
                      <div *ngIf="quizCompleted()" class="text-center py-4">
                        <div class="mb-4">
                          <i
                            class="bi fs-1 mb-3 d-block"
                            [class]="
                              quizScore() >=
                              selectedChapter()!.quiz!.passing_score
                                ? 'bi-check-circle-fill text-success'
                                : 'bi-x-circle-fill text-danger'
                            "
                          ></i>
                          <h5>
                            {{
                              quizScore() >=
                              selectedChapter()!.quiz!.passing_score
                                ? "Quiz Passed!"
                                : "Quiz Failed"
                            }}
                          </h5>
                          <p class="mb-2">
                            Your Score: <strong>{{ quizScore() }}%</strong>
                          </p>
                          <div class="progress mb-3" style="height: 8px;">
                            <div
                              class="progress-bar"
                              [style.width.%]="quizScore()"
                              [class]="
                                quizScore() >=
                                selectedChapter()!.quiz!.passing_score
                                  ? 'bg-success'
                                  : 'bg-danger'
                              "
                            ></div>
                          </div>
                          <p class="text-muted">
                            Passing Score:
                            {{ selectedChapter()!.quiz!.passing_score }}%
                          </p>
                        </div>

                        <button
                          class="btn btn-success"
                          (click)="completeLesson()"
                          [disabled]="
                            quizScore() < selectedChapter()!.quiz!.passing_score
                          "
                        >
                          <i class="bi bi-check-circle me-1"></i>
                          Complete Lesson
                        </button>
                        <button
                          class="btn btn-outline-secondary ms-2"
                          (click)="restartQuiz()"
                        >
                          <i class="bi bi-arrow-clockwise me-1"></i> Retake Quiz
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Completed Badge -->
                  <div
                    *ngIf="selectedChapter()!.progress?.completed"
                    class="alert alert-success mt-4"
                  >
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <strong>Lesson Completed!</strong>
                    <br />
                    <small class="text-muted">
                      Completed on
                      {{
                        formatDate(selectedChapter()!.progress!.completed_at!)
                      }}
                      {{
                        selectedChapter()!.progress!.quiz_score
                          ? "(Score: " +
                            selectedChapter()!.progress!.quiz_score +
                            "%)"
                          : ""
                      }}
                    </small>
                  </div>
                </div>
              </div>

              <div *ngIf="!selectedChapter()" class="text-center py-5">
                <i class="bi bi-book text-muted" style="font-size: 3rem;"></i>
                <h5 class="text-muted mt-3">Select a Subject</h5>
                <p class="text-muted">
                  Choose a subject from the sidebar to view lessons
                </p>
              </div>
            </div>

            <!-- NOTES TAB -->
            <div *ngIf="activeTab() === 'notes'" class="tab-content">
              <div class="card">
                <div class="card-header">
                  <div
                    class="d-flex justify-content-between align-items-center"
                  >
                    <h6 class="mb-0">My Notes</h6>
                    <button
                      class="btn btn-sm btn-primary"
                      (click)="showNoteForm.set(!showNoteForm())"
                    >
                      <i class="bi bi-plus-lg me-1"></i>New Note
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <!-- Note Form -->
                  <div *ngIf="showNoteForm()" class="mb-4 p-3 bg-light rounded">
                    <h6 class="mb-3">Add a New Note</h6>
                    <div class="mb-3">
                      <label class="form-label">Title</label>
                      <input
                        type="text"
                        class="form-control"
                        [(ngModel)]="newNote.title"
                        placeholder="Note title"
                      />
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Content</label>
                      <textarea
                        class="form-control"
                        [(ngModel)]="newNote.content"
                        rows="5"
                        placeholder="Write your notes here..."
                      ></textarea>
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Subject (Optional)</label>
                      <select
                        class="form-select"
                        [(ngModel)]="newNote.chapter_id"
                      >
                        <option [value]="null">No subject selected</option>
                        <option
                          *ngFor="let chapter of courseDetails()!.chapters"
                          [value]="chapter.id"
                        >
                          {{ chapter.title }}
                        </option>
                      </select>
                    </div>
                    <div class="d-flex gap-2">
                      <button
                        class="btn btn-primary btn-sm"
                        (click)="addNote()"
                      >
                        <i class="bi bi-save me-1"></i>Save Note
                      </button>
                      <button
                        class="btn btn-outline-secondary btn-sm"
                        (click)="showNoteForm.set(false)"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  <!-- Notes List -->
                  <div *ngIf="notes().length > 0" class="row g-3">
                    <div
                      *ngFor="let note of notes(); trackBy: trackByNote"
                      class="col-md-6"
                    >
                      <div class="card h-100">
                        <div class="card-body">
                          <h6 class="card-title">{{ note.title }}</h6>
                          <p class="card-text small">
                            {{ note.content.substring(0, 100) }}...
                          </p>
                          <small class="text-muted d-block mb-2">
                            <i class="bi bi-calendar"></i>
                            {{ formatDate(note.created_at) }}
                          </small>
                          <div class="d-flex gap-1">
                            <button
                              class="btn btn-xs btn-outline-primary"
                              (click)="editNote(note)"
                            >
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button
                              class="btn btn-xs btn-outline-danger"
                              (click)="deleteNote(note.id)"
                            >
                              <i class="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div *ngIf="notes().length === 0" class="text-center py-5">
                    <i
                      class="bi bi-journal-text text-muted"
                      style="font-size: 2rem;"
                    ></i>
                    <p class="text-muted mt-3">
                      No notes yet. Create one to get started!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- CALENDAR TAB -->
            <div *ngIf="activeTab() === 'calendar'" class="tab-content">
              <div class="card">
                <div class="card-header">
                  <h6 class="mb-0">📅 Course Schedule</h6>
                </div>
                <div class="card-body">
                  <div
                    *ngIf="courseDetails()!.live_classes.length > 0"
                    class="table-responsive"
                  >
                    <table class="table table-hover">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Date & Time</th>
                          <th>Duration</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          *ngFor="
                            let liveClass of courseDetails()!.live_classes;
                            trackBy: trackByLiveClass
                          "
                        >
                          <td>
                            <strong>{{ liveClass.title }}</strong>
                            <br />
                            <small class="text-muted">
                              {{
                                getChapterNameById(liveClass.chapter_id) ||
                                  "General"
                              }}
                            </small>
                          </td>
                          <td>
                            <small>
                              {{ formatSessionDate(liveClass.scheduled_date) }}
                            </small>
                          </td>
                          <td>
                            <small
                              >{{ liveClass.start_time }} -
                              {{ liveClass.end_time }}</small
                            >
                          </td>
                          <td>
                            <small
                              class="badge"
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
                          </td>
                          <td>
                            <button
                              class="btn btn-xs btn-primary"
                              *ngIf="
                                liveClass.meeting_link &&
                                isUpcoming(liveClass.scheduled_date)
                              "
                              (click)="
                                window.open(liveClass.meeting_link, '_blank')
                              "
                            >
                              Join
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div
                    *ngIf="courseDetails()!.live_classes.length === 0"
                    class="text-center py-5"
                  >
                    <i
                      class="bi bi-calendar-x text-muted"
                      style="font-size: 2rem;"
                    ></i>
                    <p class="text-muted mt-3">No sessions scheduled yet</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Video Modal -->
    <div
      *ngIf="showVideoModal()"
      class="modal fade show d-block"
      style="background-color: rgba(0,0,0,0.95);"
      tabindex="-1"
    >
      <div class="modal-dialog modal-xl">
        <div class="modal-content bg-dark">
          <div class="modal-header border-0">
            <h6 class="modal-title text-white">
              {{ currentAttachment()?.title }}
            </h6>
            <button
              type="button"
              class="btn-close btn-close-white"
              (click)="closeVideoModal()"
            ></button>
          </div>
          <div class="modal-body p-0">
            <div
              *ngIf="currentAttachment()?.file_type === 'video'"
              class="video-container"
            >
              <iframe
                [src]="getVideoEmbedUrl(currentAttachment()!.file_url)"
                width="100%"
                height="600"
                frameborder="0"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </div>
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
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .video-container {
        position: relative;
        padding-bottom: 56.25%;
        height: 0;
        overflow: hidden;
      }

      .video-container iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .form-check-input:checked {
        background-color: #0d6efd;
        border-color: #0d6efd;
      }

      .btn-xs {
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
      }

      .cursor-pointer {
        cursor: pointer;
      }

      .hover-light:hover {
        background-color: #f0f0f0;
        transition: background-color 0.2s;
      }

      .list-group-item.active {
        background-color: #0d6efd;
        border-color: #0d6efd;
      }

      @media (max-width: 768px) {
        .course-header {
          position: relative;
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

  window = window;

  ngOnInit(): void {
    const courseId = this.route.snapshot.params["id"];
    if (courseId) {
      this.loadCourseDetails(+courseId);
      this.loadNotes();
    }
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
}
