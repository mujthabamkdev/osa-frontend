// src/app/core/services/api.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, CreateUserRequest } from '../models/user.models';
import { Course, CreateCourseRequest } from '../models/course.models';
import {
  DashboardStats,
  StudentProgress,
  TeacherStats,
  ParentChild,
} from '../models/dashboard.models';
import { Enrollment } from '../models/enrollment.models';
import {
  Class,
  CreateClassRequest,
  Subject,
  CreateSubjectRequest,
  Session,
  CreateSessionRequest,
  SessionContent,
  CreateSessionContentRequest,
  Timetable,
  CreateTimetableRequest,
  ClassProgress,
  CreateClassProgressRequest,
} from '../models/school.models';
import {
  TeacherOverview,
  TeacherStudent,
  TeacherSubject,
  Exam,
  ExamCreateRequest,
  ExamResult,
  ExamResultPayload,
  TeacherLiveClass,
  LiveClassCreateRequest,
  LessonQuestion,
  LessonAnswerPayload,
  LessonAnswer,
  LessonQuestionPayload,
  StudentExamResult,
  StudentReport,
  StudentProgressEntry,
} from '../models/teacher.models';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  // Signals for loading states
  private readonly isLoading = signal(false);
  private readonly error = signal<string | null>(null);

  readonly loading = this.isLoading.asReadonly();
  readonly apiError = this.error.asReadonly();

  // User Management
  getUsers(): Observable<User[]> {
    return this.performRequest(() => this.http.get<User[]>(`${this.baseUrl}/users`));
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    return this.performRequest(() => this.http.post<User>(`${this.baseUrl}/users`, userData));
  }

  getCurrentUser(): Observable<User> {
    return this.performRequest(() => this.http.get<User>(`${this.baseUrl}/users/me`));
  }

  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.performRequest(() => this.http.put<User>(`${this.baseUrl}/users/${id}`, userData));
  }

  deleteUser(id: number): Observable<void> {
    return this.performRequest(() => this.http.delete<void>(`${this.baseUrl}/users/${id}`));
  }

  toggleUserStatus(id: number): Observable<User> {
    return this.performRequest(() =>
      this.http.patch<User>(`${this.baseUrl}/users/${id}/toggle-status`, {})
    );
  }

  // Course Management
  getCourses(): Observable<Course[]> {
    return this.performRequest(() => this.http.get<Course[]>(`${this.baseUrl}/courses`));
  }

  createCourse(courseData: CreateCourseRequest): Observable<Course> {
    return this.performRequest(() => this.http.post<Course>(`${this.baseUrl}/courses`, courseData));
  }

  getCourse(id: number): Observable<Course> {
    return this.performRequest(() => this.http.get<Course>(`${this.baseUrl}/courses/${id}`));
  }

  updateCourse(id: number, courseData: Partial<Course>): Observable<Course> {
    return this.performRequest(() =>
      this.http.put<Course>(`${this.baseUrl}/courses/${id}`, courseData)
    );
  }

  deleteCourse(id: number): Observable<void> {
    return this.performRequest(() => this.http.delete<void>(`${this.baseUrl}/courses/${id}`));
  }

  // Course Details endpoints
  getCourseDetails(courseId: number): Observable<any> {
    return this.performRequest(() => this.http.get<any>(`${this.baseUrl}/courses/${courseId}`));
  }

  completeLesson(courseId: number, chapterId: number, quizScore?: number): Observable<any> {
    return this.performRequest(() =>
      this.http.post(`${this.baseUrl}/courses/${courseId}/chapters/${chapterId}/complete`, {
        quiz_score: quizScore,
      })
    );
  }

  getCourseProgress(courseId: number): Observable<any> {
    return this.performRequest(() =>
      this.http.get<any>(`${this.baseUrl}/courses/${courseId}/progress`)
    );
  }

  getCourseLevels(courseId: number): Observable<any[]> {
    return this.performRequest(() =>
      this.http.get<any>(`${this.baseUrl}/courses/${courseId}`)
    ).pipe(
      tap((response) => response),
      map((response) => {
        // Flatten subjects and their lessons into a levels array
        const levels: any[] = [];
        if (response?.subjects) {
          response.subjects.forEach((subject: any) => {
            if (subject.lessons && Array.isArray(subject.lessons)) {
              subject.lessons.forEach((lesson: any) => {
                levels.push({
                  id: lesson.id,
                  course_id: courseId,
                  subject_id: subject.id,
                  subject_title: subject.name,
                  title: lesson.title,
                  description: lesson.description,
                  order: lesson.order_in_course,
                  progress: lesson.progress,
                  attachments: lesson.contents || [],
                  quiz: lesson.quiz,
                  scheduled_date: lesson.scheduled_date,
                  created_at: lesson.created_at,
                });
              });
            }
          });
        }
        return levels;
      })
    );
  }

  // Student-specific endpoints
  getStudentCourses(): Observable<Course[]> {
    return this.performRequest(() => this.http.get<Course[]>(`${this.baseUrl}/students/courses`));
  }

  getAvailableCourses(): Observable<Course[]> {
    return this.performRequest(() =>
      this.http.get<Course[]>(`${this.baseUrl}/students/available-courses`)
    );
  }

  enrollInCourse(courseId: number): Observable<Enrollment> {
    return this.performRequest(() =>
      this.http.post<Enrollment>(`${this.baseUrl}/students/enroll`, {
        course_id: courseId,
      })
    );
  }

  unenrollFromCourse(courseId: number): Observable<void> {
    return this.performRequest(() =>
      this.http.delete<void>(`${this.baseUrl}/students/unenroll/${courseId}`)
    );
  }

  getStudentProgress(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/students/${studentId}/progress`);
  }

  updateStudentProgress(courseId: number, progress: number): Observable<void> {
    return this.performRequest(() =>
      this.http.patch<void>(`${this.baseUrl}/students/progress/${courseId}`, {
        progress,
      })
    );
  }

  askLessonQuestion(lessonId: number, payload: LessonQuestionPayload): Observable<LessonQuestion> {
    return this.performRequest(() =>
      this.http.post<LessonQuestion>(`${this.baseUrl}/students/lessons/${lessonId}/questions`, payload)
    );
  }

  getLessonQuestions(lessonId: number): Observable<LessonQuestion[]> {
    return this.performRequest(() =>
      this.http.get<LessonQuestion[]>(`${this.baseUrl}/students/lessons/${lessonId}/questions`)
    );
  }

  getMyExamResults(): Observable<StudentExamResult[]> {
    return this.performRequest(() =>
      this.http.get<StudentExamResult[]>(`${this.baseUrl}/students/me/exams`)
    );
  }

  // Teacher-specific endpoints
  getTeacherCourses(): Observable<Course[]> {
    return this.performRequest(() => this.http.get<Course[]>(`${this.baseUrl}/teachers/courses`));
  }

  getTeacherOverview(): Observable<TeacherOverview> {
    return this.performRequest(() =>
      this.http.get<TeacherOverview>(`${this.baseUrl}/teachers/overview`)
    );
  }

  getTeacherStudents(): Observable<TeacherStudent[]> {
    return this.performRequest(() =>
      this.http.get<TeacherStudent[]>(`${this.baseUrl}/teachers/students`)
    );
  }

  getTeacherStudentsByCourse(courseId: number): Observable<TeacherStudent[]> {
    return this.performRequest(() =>
      this.http.get<TeacherStudent[]>(`${this.baseUrl}/teachers/courses/${courseId}/students`)
    );
  }

  getTeacherSubjects(): Observable<TeacherSubject[]> {
    return this.performRequest(() =>
      this.http.get<TeacherSubject[]>(`${this.baseUrl}/teachers/subjects`)
    );
  }

  createExam(payload: ExamCreateRequest): Observable<Exam> {
    return this.performRequest(() => this.http.post<Exam>(`${this.baseUrl}/teachers/exams`, payload));
  }

  getTeacherExams(): Observable<Exam[]> {
    return this.performRequest(() => this.http.get<Exam[]>(`${this.baseUrl}/teachers/exams`));
  }

  getExam(examId: number): Observable<Exam> {
    return this.performRequest(() => this.http.get<Exam>(`${this.baseUrl}/teachers/exams/${examId}`));
  }

  getExamResults(examId: number): Observable<ExamResult[]> {
    return this.performRequest(() =>
      this.http.get<ExamResult[]>(`${this.baseUrl}/teachers/exams/${examId}/results`)
    );
  }

  saveExamResults(examId: number, results: ExamResultPayload[]): Observable<ExamResult[]> {
    return this.performRequest(() =>
      this.http.post<ExamResult[]>(`${this.baseUrl}/teachers/exams/${examId}/results`, {
        results,
      })
    );
  }

  getTeacherLiveClasses(): Observable<TeacherLiveClass[]> {
    return this.performRequest(() =>
      this.http.get<TeacherLiveClass[]>(`${this.baseUrl}/teachers/live-classes`)
    );
  }

  scheduleLiveClass(payload: LiveClassCreateRequest): Observable<TeacherLiveClass> {
    return this.performRequest(() =>
      this.http.post<TeacherLiveClass>(`${this.baseUrl}/teachers/live-classes`, payload)
    );
  }

  getLessonQuestionsForTeacher(lessonId: number): Observable<LessonQuestion[]> {
    return this.performRequest(() =>
      this.http.get<LessonQuestion[]>(`${this.baseUrl}/teachers/lessons/${lessonId}/questions`)
    );
  }

  answerLessonQuestion(
    lessonId: number,
    questionId: number,
    payload: LessonAnswerPayload
  ): Observable<LessonAnswer> {
    return this.performRequest(() =>
      this.http.post<LessonAnswer>(
        `${this.baseUrl}/teachers/lessons/${lessonId}/questions/${questionId}/answers`,
        payload
      )
    );
  }

  getTeacherStudentReport(studentId: number): Observable<StudentReport> {
    return this.performRequest(() =>
      this.http.get<StudentReport>(`${this.baseUrl}/teachers/students/${studentId}/report`)
    );
  }

  getTeacherStats(): Observable<TeacherStats> {
    return this.performRequest(() => this.http.get<TeacherStats>(`${this.baseUrl}/teachers/stats`));
  }

  getCourseEnrollments(courseId: number): Observable<Enrollment[]> {
    return this.performRequest(() =>
      this.http.get<Enrollment[]>(`${this.baseUrl}/teachers/courses/${courseId}/enrollments`)
    );
  }

  // Parent-specific endpoints
  getChildrenCourses(parentId: number): Observable<ParentChild[]> {
    return this.performRequest(() =>
      this.http.get<ParentChild[]>(`${this.baseUrl}/parents/${parentId}/children-courses`)
    );
  }

  linkChild(childEmail: string): Observable<void> {
    return this.performRequest(() =>
      this.http.post<void>(`${this.baseUrl}/parents/link-child`, {
        child_email: childEmail,
      })
    );
  }

  unlinkChild(childId: number): Observable<void> {
    return this.performRequest(() =>
      this.http.delete<void>(`${this.baseUrl}/parents/unlink-child/${childId}`)
    );
  }

  // Admin-specific endpoints
  getDashboardStats(): Observable<DashboardStats> {
    return this.performRequest(() => this.http.get<DashboardStats>(`${this.baseUrl}/admin/stats`));
  }

  getUsersByRole(role: string): Observable<User[]> {
    return this.performRequest(() =>
      this.http.get<User[]>(`${this.baseUrl}/admin/users`, { params: { role } })
    );
  }

  getSystemHealth(): Observable<{
    status: string;
    uptime: number;
    version: string;
  }> {
    return this.performRequest(() =>
      this.http.get<{ status: string; uptime: number; version: string }>(
        `${this.baseUrl}/admin/health`
      )
    );
  }

  // Search and filtering
  searchCourses(query: string): Observable<Course[]> {
    const params = new HttpParams().set('q', query);
    return this.performRequest(() =>
      this.http.get<Course[]>(`${this.baseUrl}/courses/search`, { params })
    );
  }

  searchUsers(query: string, role?: string): Observable<User[]> {
    let params = new HttpParams().set('q', query);
    if (role) {
      params = params.set('role', role);
    }
    return this.performRequest(() =>
      this.http.get<User[]>(`${this.baseUrl}/users/search`, { params })
    );
  }

  // Utility method to handle common request patterns
  private performRequest<T>(requestFn: () => Observable<T>): Observable<T> {
    this.isLoading.set(true);
    this.error.set(null);

    return requestFn().pipe(
      tap(() => this.isLoading.set(false)),
      catchError((error) => {
        this.isLoading.set(false);
        const errorMessage = error?.error?.detail || 'An error occurred';
        this.error.set(errorMessage);
        return throwError(() => error);
      })
    );
  }

  getEnrolledCourses(userId: number): Observable<StudentProgress[]> {
    return this.http.get<StudentProgress[]>(`${this.baseUrl}/students/${userId}/enrolled-courses`);
  }

  getParentChildren(parentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/parents/${parentId}/children`);
  }

  getChildAcademicReport(childId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/students/${childId}/academic-report`);
  }

  // Notes endpoints
  getStudentNotes(studentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/students/${studentId}/notes`);
  }

  createNote(
    studentId: number,
    title: string,
    content: string,
    courseId?: number
  ): Observable<any> {
    return this.performRequest(() =>
      this.http.post(`${this.baseUrl}/students/${studentId}/notes`, {
        title,
        content,
        course_id: courseId,
      })
    );
  }

  updateNote(studentId: number, noteId: number, title?: string, content?: string): Observable<any> {
    return this.performRequest(() =>
      this.http.put(`${this.baseUrl}/students/${studentId}/notes/${noteId}`, {
        title,
        content,
      })
    );
  }

  deleteNote(studentId: number, noteId: number): Observable<any> {
    return this.performRequest(() =>
      this.http.delete(`${this.baseUrl}/students/${studentId}/notes/${noteId}`)
    );
  }

  // School Management
  // Classes
  getClasses(courseId: number): Observable<Class[]> {
    return this.performRequest(() =>
      this.http.get<Class[]>(`${this.baseUrl}/school/courses/${courseId}/classes`)
    );
  }

  createClass(courseId: number, classData: CreateClassRequest): Observable<Class> {
    return this.performRequest(() =>
      this.http.post<Class>(`${this.baseUrl}/school/courses/${courseId}/classes`, classData)
    );
  }

  getClass(classId: number): Observable<Class> {
    return this.performRequest(() =>
      this.http.get<Class>(`${this.baseUrl}/school/classes/${classId}`)
    );
  }

  updateClass(classId: number, classData: Partial<Class>): Observable<Class> {
    return this.performRequest(() =>
      this.http.put<Class>(`${this.baseUrl}/school/classes/${classId}`, classData)
    );
  }

  deleteClass(classId: number): Observable<void> {
    return this.performRequest(() =>
      this.http.delete<void>(`${this.baseUrl}/school/classes/${classId}`)
    );
  }

  // Subjects
  getSubjects(classId: number): Observable<Subject[]> {
    return this.performRequest(() =>
      this.http.get<Subject[]>(`${this.baseUrl}/school/classes/${classId}/subjects`)
    );
  }

  createSubject(subjectData: CreateSubjectRequest): Observable<Subject> {
    return this.performRequest(() =>
      this.http.post<Subject>(`${this.baseUrl}/school/subjects`, subjectData)
    );
  }

  getSubject(subjectId: number): Observable<Subject> {
    return this.performRequest(() =>
      this.http.get<Subject>(`${this.baseUrl}/school/subjects/${subjectId}`)
    );
  }

  updateSubject(subjectId: number, subjectData: Partial<Subject>): Observable<Subject> {
    return this.performRequest(() =>
      this.http.put<Subject>(`${this.baseUrl}/school/subjects/${subjectId}`, subjectData)
    );
  }

  deleteSubject(subjectId: number): Observable<void> {
    return this.performRequest(() =>
      this.http.delete<void>(`${this.baseUrl}/school/subjects/${subjectId}`)
    );
  }

  // Sessions
  getSessions(subjectId: number): Observable<Session[]> {
    return this.performRequest(() =>
      this.http.get<Session[]>(`${this.baseUrl}/school/subjects/${subjectId}/sessions`)
    );
  }

  createSession(sessionData: CreateSessionRequest): Observable<Session> {
    return this.performRequest(() =>
      this.http.post<Session>(`${this.baseUrl}/school/sessions`, sessionData)
    );
  }

  getSession(sessionId: number): Observable<Session> {
    return this.performRequest(() =>
      this.http.get<Session>(`${this.baseUrl}/school/sessions/${sessionId}`)
    );
  }

  updateSession(sessionId: number, sessionData: Partial<Session>): Observable<Session> {
    return this.performRequest(() =>
      this.http.put<Session>(`${this.baseUrl}/school/sessions/${sessionId}`, sessionData)
    );
  }

  deleteSession(sessionId: number): Observable<void> {
    return this.performRequest(() =>
      this.http.delete<void>(`${this.baseUrl}/school/sessions/${sessionId}`)
    );
  }

  // Session Contents
  getSessionContents(sessionId: number): Observable<SessionContent[]> {
    return this.performRequest(() =>
      this.http.get<SessionContent[]>(`${this.baseUrl}/school/sessions/${sessionId}/contents`)
    );
  }

  createSessionContent(contentData: CreateSessionContentRequest): Observable<SessionContent> {
    return this.performRequest(() =>
      this.http.post<SessionContent>(`${this.baseUrl}/school/contents`, contentData)
    );
  }

  getSessionContent(contentId: number): Observable<SessionContent> {
    return this.performRequest(() =>
      this.http.get<SessionContent>(`${this.baseUrl}/school/contents/${contentId}`)
    );
  }

  updateSessionContent(
    contentId: number,
    contentData: Partial<SessionContent>
  ): Observable<SessionContent> {
    return this.performRequest(() =>
      this.http.put<SessionContent>(`${this.baseUrl}/school/contents/${contentId}`, contentData)
    );
  }

  deleteSessionContent(contentId: number): Observable<void> {
    return this.performRequest(() =>
      this.http.delete<void>(`${this.baseUrl}/school/contents/${contentId}`)
    );
  }

  // Timetables
  getTimetable(classId: number): Observable<Timetable[]> {
    return this.performRequest(() =>
      this.http.get<Timetable[]>(`${this.baseUrl}/school/classes/${classId}/timetable`)
    );
  }

  createTimetable(timetableData: CreateTimetableRequest): Observable<Timetable> {
    return this.performRequest(() =>
      this.http.post<Timetable>(`${this.baseUrl}/school/timetables`, timetableData)
    );
  }

  updateTimetable(timetableId: number, timetableData: Partial<Timetable>): Observable<Timetable> {
    return this.performRequest(() =>
      this.http.put<Timetable>(`${this.baseUrl}/school/timetables/${timetableId}`, timetableData)
    );
  }

  deleteTimetable(timetableId: number): Observable<void> {
    return this.performRequest(() =>
      this.http.delete<void>(`${this.baseUrl}/school/timetables/${timetableId}`)
    );
  }

  // Class Progress
  getClassProgress(studentId: number): Observable<ClassProgress[]> {
    return this.performRequest(() =>
      this.http.get<ClassProgress[]>(`${this.baseUrl}/school/students/${studentId}/progress`)
    );
  }

  updateClassProgress(progressData: CreateClassProgressRequest): Observable<ClassProgress> {
    return this.performRequest(() =>
      this.http.post<ClassProgress>(`${this.baseUrl}/school/progress`, progressData)
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, {
      email: email,
      password: password,
    });
  }

  register(email: string, password: string, fullName: string, role: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/register`, {
      email: email,
      password: password,
      fullName: fullName,
      role: role,
    });
  }

  // Clear error signal
  clearError(): void {
    this.error.set(null);
  }
}
