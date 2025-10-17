// src/app/core/services/api.service.ts
import { Injectable, inject, signal } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, tap, catchError, throwError, map } from "rxjs";
import { environment } from "../../../environments/environment";
import { User, CreateUserRequest } from "../models/user.models";
import { Course, CreateCourseRequest } from "../models/course.models";
import {
  DashboardStats,
  StudentProgress,
  TeacherStats,
  ParentChild,
} from "../models/dashboard.models";
import { Enrollment } from "../models/enrollment.models";

@Injectable({
  providedIn: "root",
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
    return this.performRequest(() =>
      this.http.get<User[]>(`${this.baseUrl}/users`)
    );
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    return this.performRequest(() =>
      this.http.post<User>(`${this.baseUrl}/users`, userData)
    );
  }

  getCurrentUser(): Observable<User> {
    return this.performRequest(() =>
      this.http.get<User>(`${this.baseUrl}/users/me`)
    );
  }

  updateUser(id: number, userData: Partial<User>): Observable<User> {
    return this.performRequest(() =>
      this.http.put<User>(`${this.baseUrl}/users/${id}`, userData)
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.performRequest(() =>
      this.http.delete<void>(`${this.baseUrl}/users/${id}`)
    );
  }

  toggleUserStatus(id: number): Observable<User> {
    return this.performRequest(() =>
      this.http.patch<User>(`${this.baseUrl}/users/${id}/toggle-status`, {})
    );
  }

  // Course Management
  getCourses(): Observable<Course[]> {
    return this.performRequest(() =>
      this.http.get<Course[]>(`${this.baseUrl}/courses`)
    );
  }

  createCourse(courseData: CreateCourseRequest): Observable<Course> {
    return this.performRequest(() =>
      this.http.post<Course>(`${this.baseUrl}/courses`, courseData)
    );
  }

  getCourse(id: number): Observable<Course> {
    return this.performRequest(() =>
      this.http.get<Course>(`${this.baseUrl}/courses/${id}`)
    );
  }

  updateCourse(id: number, courseData: Partial<Course>): Observable<Course> {
    return this.performRequest(() =>
      this.http.put<Course>(`${this.baseUrl}/courses/${id}`, courseData)
    );
  }

  deleteCourse(id: number): Observable<void> {
    return this.performRequest(() =>
      this.http.delete<void>(`${this.baseUrl}/courses/${id}`)
    );
  }

  // Course Details endpoints
  getCourseDetails(courseId: number): Observable<any> {
    return this.performRequest(() =>
      this.http.get<any>(`${this.baseUrl}/courses/${courseId}`)
    );
  }

  completeLesson(
    courseId: number,
    chapterId: number,
    quizScore?: number
  ): Observable<any> {
    return this.performRequest(() =>
      this.http.post(
        `${this.baseUrl}/courses/${courseId}/chapters/${chapterId}/complete`,
        {
          quiz_score: quizScore,
        }
      )
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
      map((response) => response?.chapters || [])
    );
  }

  // Student-specific endpoints
  getStudentCourses(): Observable<Course[]> {
    return this.performRequest(() =>
      this.http.get<Course[]>(`${this.baseUrl}/students/courses`)
    );
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
    return this.http.get<any[]>(
      `${this.baseUrl}/students/${studentId}/progress`
    );
  }

  updateStudentProgress(courseId: number, progress: number): Observable<void> {
    return this.performRequest(() =>
      this.http.patch<void>(`${this.baseUrl}/students/progress/${courseId}`, {
        progress,
      })
    );
  }

  // Teacher-specific endpoints
  getTeacherCourses(): Observable<Course[]> {
    return this.performRequest(() =>
      this.http.get<Course[]>(`${this.baseUrl}/teachers/courses`)
    );
  }

  getTeacherStats(): Observable<TeacherStats> {
    return this.performRequest(() =>
      this.http.get<TeacherStats>(`${this.baseUrl}/teachers/stats`)
    );
  }

  getCourseEnrollments(courseId: number): Observable<Enrollment[]> {
    return this.performRequest(() =>
      this.http.get<Enrollment[]>(
        `${this.baseUrl}/teachers/courses/${courseId}/enrollments`
      )
    );
  }

  // Parent-specific endpoints
  getChildrenCourses(parentId: number): Observable<ParentChild[]> {
    return this.performRequest(() =>
      this.http.get<ParentChild[]>(
        `${this.baseUrl}/parents/${parentId}/children-courses`
      )
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
    return this.performRequest(() =>
      this.http.get<DashboardStats>(`${this.baseUrl}/admin/stats`)
    );
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
    const params = new HttpParams().set("q", query);
    return this.performRequest(() =>
      this.http.get<Course[]>(`${this.baseUrl}/courses/search`, { params })
    );
  }

  searchUsers(query: string, role?: string): Observable<User[]> {
    let params = new HttpParams().set("q", query);
    if (role) {
      params = params.set("role", role);
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
        const errorMessage = error?.error?.detail || "An error occurred";
        this.error.set(errorMessage);
        return throwError(() => error);
      })
    );
  }

  getEnrolledCourses(userId: number): Observable<StudentProgress[]> {
    return this.http.get<StudentProgress[]>(
      `${this.baseUrl}/students/${userId}/enrolled-courses`
    );
  }

  getParentChildren(parentId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/parents/${parentId}/children`);
  }

  getChildAcademicReport(childId: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/students/${childId}/academic-report`
    );
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

  updateNote(
    studentId: number,
    noteId: number,
    title?: string,
    content?: string
  ): Observable<any> {
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

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, {
      email: email,
      password: password,
    });
  }

  register(
    email: string,
    password: string,
    fullName: string,
    role: string
  ): Observable<any> {
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
