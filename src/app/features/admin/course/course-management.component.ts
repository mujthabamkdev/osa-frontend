import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import {
  Course,
  CourseLesson,
  CourseLessonContent,
  CourseLessonContentPayload,
  CourseLessonPayload,
  CourseSubject,
  CourseSubjectPayload,
  CreateCourseRequest,
} from '../../../core/models/course.models';

@Component({
  selector: 'app-admin-course-management',
  templateUrl: './course-management.component.html',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseManagementComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  readonly courses = signal<Course[]>([]);
  readonly coursesLoading = signal(false);
  readonly courseSaving = signal(false);

  readonly subjects = signal<CourseSubject[]>([]);
  readonly subjectsLoading = signal(false);
  readonly subjectSaving = signal(false);

  readonly lessons = signal<CourseLesson[]>([]);
  readonly lessonsLoading = signal(false);
  readonly lessonSaving = signal(false);

  readonly contents = signal<CourseLessonContent[]>([]);
  readonly contentsLoading = signal(false);
  readonly contentSaving = signal(false);

  readonly selectedCourseId = signal<number | null>(null);
  readonly selectedSubjectId = signal<number | null>(null);
  readonly selectedLessonId = signal<number | null>(null);

  readonly showCourseModal = signal(false);
  readonly showSubjectModal = signal(false);
  readonly showLessonModal = signal(false);
  readonly showContentModal = signal(false);

  readonly courseDraft = signal<CreateCourseRequest>({
    title: '',
    description: '',
  });

  readonly subjectForm = signal<CourseSubjectPayload>({
    course_id: 0,
    name: '',
    description: '',
    instructor_id: null,
    order_in_course: 1,
  });

  readonly lessonForm = signal<CourseLessonPayload>({
    subject_id: 0,
    title: '',
    description: '',
    scheduled_date: null,
    order_in_subject: 1,
  });

  readonly contentForm = signal<CourseLessonContentPayload>({
    lesson_id: 0,
    title: '',
    content_type: 'text',
    content_url: null,
    content_text: '',
    order_in_lesson: 1,
  });

  readonly editingSubjectId = signal<number | null>(null);
  readonly editingLessonId = signal<number | null>(null);
  readonly editingContentId = signal<number | null>(null);

  readonly selectedCourse = computed(() =>
    this.courses().find((course) => course.id === this.selectedCourseId()) ?? null
  );

  readonly selectedSubject = computed(() =>
    this.subjects().find((subject) => subject.id === this.selectedSubjectId()) ?? null
  );

  readonly selectedLesson = computed(() =>
    this.lessons().find((lesson) => lesson.id === this.selectedLessonId()) ?? null
  );

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.coursesLoading.set(true);
    this.apiService.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.coursesLoading.set(false);
        if (this.selectedCourseId()) {
          const stillExists = courses.some((course) => course.id === this.selectedCourseId());
          if (!stillExists) {
            this.resetSelections();
          }
        }
      },
      error: (error) => {
        console.error('Failed to load courses', error);
        this.coursesLoading.set(false);
        this.resetSelections();
        this.courses.set([]);
      },
    });
  }

  selectCourse(course: Course): void {
    if (this.selectedCourseId() === course.id) {
      return;
    }
    this.selectedCourseId.set(course.id);
    this.selectedSubjectId.set(null);
    this.selectedLessonId.set(null);
    this.subjects.set([]);
    this.lessons.set([]);
    this.contents.set([]);
    this.loadSubjects(course.id);
  }

  private loadSubjects(courseId: number): void {
    this.subjectsLoading.set(true);
    this.apiService.getCourseSubjects(courseId).subscribe({
      next: (subjects) => {
        this.subjects.set(subjects);
        this.subjectsLoading.set(false);
        if (!subjects.length) {
          this.selectedSubjectId.set(null);
          this.lessons.set([]);
          this.contents.set([]);
          return;
        }
        if (this.selectedSubjectId()) {
          const stillExists = subjects.some((subject) => subject.id === this.selectedSubjectId());
          if (!stillExists) {
            this.selectedSubjectId.set(subjects[0].id);
            this.loadLessons(subjects[0].id);
            return;
          }
        } else {
          this.selectedSubjectId.set(subjects[0].id);
          this.loadLessons(subjects[0].id);
        }
      },
      error: (error) => {
        console.error('Failed to load subjects', error);
        this.subjectsLoading.set(false);
        this.subjects.set([]);
        this.selectedSubjectId.set(null);
        this.lessons.set([]);
        this.contents.set([]);
      },
    });
  }

  selectSubject(subject: CourseSubject): void {
    if (this.selectedSubjectId() === subject.id) {
      return;
    }
    this.selectedSubjectId.set(subject.id);
    this.selectedLessonId.set(null);
    this.lessons.set([]);
    this.contents.set([]);
    this.loadLessons(subject.id);
  }

  private loadLessons(subjectId: number): void {
    this.lessonsLoading.set(true);
    this.apiService.getSubjectLessons(subjectId).subscribe({
      next: (lessons) => {
        this.lessons.set(lessons);
        this.lessonsLoading.set(false);
        if (!lessons.length) {
          this.selectedLessonId.set(null);
          this.contents.set([]);
          return;
        }
        if (this.selectedLessonId()) {
          const stillExists = lessons.some((lesson) => lesson.id === this.selectedLessonId());
          if (!stillExists) {
            this.selectedLessonId.set(lessons[0].id);
            this.loadContents(lessons[0].id);
            return;
          }
        } else {
          this.selectedLessonId.set(lessons[0].id);
          this.loadContents(lessons[0].id);
        }
      },
      error: (error) => {
        console.error('Failed to load lessons', error);
        this.lessonsLoading.set(false);
        this.lessons.set([]);
        this.selectedLessonId.set(null);
        this.contents.set([]);
      },
    });
  }

  selectLesson(lesson: CourseLesson): void {
    if (this.selectedLessonId() === lesson.id) {
      return;
    }
    this.selectedLessonId.set(lesson.id);
    this.contents.set([]);
    this.loadContents(lesson.id);
  }

  private loadContents(lessonId: number): void {
    this.contentsLoading.set(true);
    const subjectId = this.selectedSubjectId();
    if (!subjectId) {
      this.contentsLoading.set(false);
      return;
    }
    this.apiService.getLessonContents(subjectId, lessonId).subscribe({
      next: (contents) => {
        this.contents.set(contents);
        this.contentsLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load lesson contents', error);
        this.contentsLoading.set(false);
        this.contents.set([]);
      },
    });
  }

  openCreateCourseModal(): void {
    this.courseDraft.set({ title: '', description: '' });
    this.showCourseModal.set(true);
  }

  createCourse(): void {
    if (this.courseSaving()) {
      return;
    }
    this.courseSaving.set(true);
    this.apiService.createCourse(this.courseDraft()).subscribe({
      next: () => {
        this.showCourseModal.set(false);
        this.courseSaving.set(false);
        this.loadCourses();
      },
      error: (error) => {
        console.error('Failed to create course', error);
        this.courseSaving.set(false);
      },
    });
  }

  deleteCourse(course: Course): void {
    if (!confirm(`Delete course "${course.title}"? This action cannot be undone.`)) {
      return;
    }
    this.apiService.deleteCourse(course.id).subscribe({
      next: () => {
        if (this.selectedCourseId() === course.id) {
          this.resetSelections();
        }
        this.loadCourses();
      },
      error: (error) => console.error('Failed to delete course', error),
    });
  }

  openSubjectModal(subject?: CourseSubject): void {
    const courseId = this.selectedCourseId();
    if (!courseId) {
      return;
    }
    this.editingSubjectId.set(subject ? subject.id : null);
    this.subjectForm.set({
      course_id: courseId,
      name: subject?.name ?? '',
      description: subject?.description ?? '',
      instructor_id: subject?.instructor_id ?? null,
      order_in_course: subject?.order_in_course ?? this.subjects().length + 1,
    });
    this.showSubjectModal.set(true);
  }

  saveSubject(): void {
    const courseId = this.selectedCourseId();
    if (!courseId || this.subjectSaving()) {
      return;
    }
    this.subjectSaving.set(true);
    const subjectId = this.editingSubjectId();
    const payload = { ...this.subjectForm(), course_id: courseId };
    const request$ = subjectId
      ? this.apiService.updateCourseSubject(courseId, subjectId, payload)
      : this.apiService.createCourseSubject(courseId, payload);

    request$.subscribe({
      next: () => {
        this.subjectSaving.set(false);
        this.showSubjectModal.set(false);
        this.loadSubjects(courseId);
      },
      error: (error) => {
        console.error('Failed to save subject', error);
        this.subjectSaving.set(false);
      },
    });
  }

  deleteSubject(subject: CourseSubject): void {
    const courseId = this.selectedCourseId();
    if (!courseId) {
      return;
    }
    if (!confirm(`Delete subject "${subject.name}" and all associated lessons?`)) {
      return;
    }
    this.apiService.deleteCourseSubject(courseId, subject.id).subscribe({
      next: () => {
        if (this.selectedSubjectId() === subject.id) {
          this.selectedSubjectId.set(null);
          this.selectedLessonId.set(null);
          this.lessons.set([]);
          this.contents.set([]);
        }
        this.loadSubjects(courseId);
      },
      error: (error) => console.error('Failed to delete subject', error),
    });
  }

  openLessonModal(lesson?: CourseLesson): void {
    const subjectId = this.selectedSubjectId();
    if (!subjectId) {
      return;
    }
    this.editingLessonId.set(lesson ? lesson.id : null);
    this.lessonForm.set({
      subject_id: subjectId,
      title: lesson?.title ?? '',
      description: lesson?.description ?? '',
      scheduled_date: lesson?.scheduled_date ?? null,
      order_in_subject: lesson?.order_in_subject ?? this.lessons().length + 1,
    });
    this.showLessonModal.set(true);
  }

  saveLesson(): void {
    const subjectId = this.selectedSubjectId();
    if (!subjectId || this.lessonSaving()) {
      return;
    }
    this.lessonSaving.set(true);
    const lessonId = this.editingLessonId();
    const payload = { ...this.lessonForm(), subject_id: subjectId };
    const request$ = lessonId
      ? this.apiService.updateSubjectLesson(subjectId, lessonId, payload)
      : this.apiService.createSubjectLesson(subjectId, payload);

    request$.subscribe({
      next: (lesson) => {
        this.lessonSaving.set(false);
        this.showLessonModal.set(false);
        this.loadLessons(subjectId);
        if (!lessonId) {
          this.selectedLessonId.set(lesson.id);
          this.loadContents(lesson.id);
        } else {
          this.loadContents(lessonId);
        }
      },
      error: (error) => {
        console.error('Failed to save lesson', error);
        this.lessonSaving.set(false);
      },
    });
  }

  deleteLesson(lesson: CourseLesson): void {
    const subjectId = this.selectedSubjectId();
    if (!subjectId) {
      return;
    }
    if (!confirm(`Delete lesson "${lesson.title}" and all associated content?`)) {
      return;
    }
    this.apiService.deleteSubjectLesson(subjectId, lesson.id).subscribe({
      next: () => {
        if (this.selectedLessonId() === lesson.id) {
          this.selectedLessonId.set(null);
          this.contents.set([]);
        }
        this.loadLessons(subjectId);
      },
      error: (error) => console.error('Failed to delete lesson', error),
    });
  }

  openContentModal(content?: CourseLessonContent): void {
    const lessonId = this.selectedLessonId();
    if (!lessonId) {
      return;
    }
    this.editingContentId.set(content ? content.id : null);
    this.contentForm.set({
      lesson_id: lessonId,
      title: content?.title ?? '',
      content_type: content?.content_type ?? 'text',
      content_url: content?.content_url ?? null,
      content_text: content?.content_text ?? '',
      order_in_lesson: content?.order_in_lesson ?? this.contents().length + 1,
    });
    this.showContentModal.set(true);
  }

  saveContent(): void {
    const subjectId = this.selectedSubjectId();
    const lessonId = this.selectedLessonId();
    if (!subjectId || !lessonId || this.contentSaving()) {
      return;
    }
    this.contentSaving.set(true);
    const contentId = this.editingContentId();
    const payload = {
      ...this.contentForm(),
      lesson_id: lessonId,
      content_url: this.normalizeOptionalField(this.contentForm().content_url),
      content_text: this.normalizeOptionalField(this.contentForm().content_text),
    };
    const request$ = contentId
      ? this.apiService.updateLessonContent(subjectId, lessonId, contentId, payload)
      : this.apiService.createLessonContent(subjectId, lessonId, payload);

    request$.subscribe({
      next: () => {
        this.contentSaving.set(false);
        this.showContentModal.set(false);
        this.loadContents(lessonId);
      },
      error: (error) => {
        console.error('Failed to save content', error);
        this.contentSaving.set(false);
      },
    });
  }

  deleteContent(content: CourseLessonContent): void {
    const subjectId = this.selectedSubjectId();
    const lessonId = this.selectedLessonId();
    if (!subjectId || !lessonId) {
      return;
    }
    if (!confirm(`Delete content "${content.title}"?`)) {
      return;
    }
    this.apiService.deleteLessonContent(subjectId, lessonId, content.id).subscribe({
      next: () => this.loadContents(lessonId),
      error: (error) => console.error('Failed to delete content', error),
    });
  }

  updateCourseTitle(title: string): void {
    this.courseDraft.update((form) => ({ ...form, title }));
  }

  updateCourseDescription(description: string): void {
    this.courseDraft.update((form) => ({ ...form, description }));
  }

  updateSubjectForm<K extends keyof CourseSubjectPayload>(key: K, value: CourseSubjectPayload[K]): void {
    this.subjectForm.update((form) => {
      if (key === 'order_in_course') {
        return { ...form, order_in_course: Number(value) || 1 };
      }
      if (key === 'instructor_id') {
        const instructorId = value === null || value === undefined || value === '' ? null : Number(value);
        return { ...form, instructor_id: instructorId };
      }
      return { ...form, [key]: value } as CourseSubjectPayload;
    });
  }

  updateLessonForm<K extends keyof CourseLessonPayload>(key: K, value: CourseLessonPayload[K]): void {
    this.lessonForm.update((form) => {
      if (key === 'order_in_subject') {
        return { ...form, order_in_subject: Number(value) || 1 };
      }
      if (key === 'scheduled_date') {
        const dateValue = value ? String(value) : null;
        return { ...form, scheduled_date: dateValue };
      }
      return { ...form, [key]: value } as CourseLessonPayload;
    });
  }

  updateContentForm<K extends keyof CourseLessonContentPayload>(key: K, value: CourseLessonContentPayload[K]): void {
    this.contentForm.update((form) => {
      if (key === 'order_in_lesson') {
        return { ...form, order_in_lesson: Number(value) || 1 };
      }
      if (key === 'content_url' || key === 'content_text') {
        const normalized = this.normalizeOptionalField(value as string | null | undefined);
        return { ...form, [key]: normalized } as CourseLessonContentPayload;
      }
      return { ...form, [key]: value } as CourseLessonContentPayload;
    });
  }

  private normalizeOptionalField(value: string | null | undefined): string | null {
    if (value === undefined) {
      return null;
    }
    const trimmed = typeof value === 'string' ? value.trim() : value;
    return trimmed ? (trimmed as string) : null;
  }

  private resetSelections(): void {
    this.selectedCourseId.set(null);
    this.selectedSubjectId.set(null);
    this.selectedLessonId.set(null);
    this.subjects.set([]);
    this.lessons.set([]);
    this.contents.set([]);
  }
}
