import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Course } from '../../../core/models/course.models';
import { Class as SchoolClass } from '../../../core/models/school.models';
import {
  AdminParent,
  ApproveUserPayload,
  PendingUser,
  StudentAdmin,
} from '../../../core/models/admin.models';
import { CreateUserRequest } from '../../../core/models/user.models';

type CourseAssignment = { courseId: number | null; classId: number | null };

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  readonly viewMode = signal<'pending' | 'students' | 'parents'>('pending');

  readonly pendingUsers = signal<PendingUser[]>([]);
  readonly students = signal<StudentAdmin[]>([]);
  readonly parents = signal<AdminParent[]>([]);

  readonly loadingPending = signal(false);
  readonly loadingStudents = signal(false);
  readonly loadingParents = signal(false);
  readonly coursesLoading = signal(false);
  readonly approving = signal(false);
  readonly enrollmentSaving = signal(false);
  readonly parentSaving = signal(false);
  readonly creatingStudent = signal(false);

  readonly courses = signal<Course[]>([]);
  readonly classesCache = signal<Record<number, SchoolClass[]>>({});
  readonly classesLoading = signal<Record<number, boolean>>({});

  readonly approvalModalOpen = signal(false);
  readonly enrollmentModalOpen = signal(false);
  readonly parentModalOpen = signal(false);
  readonly studentModalOpen = signal(false);

  readonly selectedPendingUser = signal<PendingUser | null>(null);
  readonly selectedStudent = signal<StudentAdmin | null>(null);
  readonly selectedParent = signal<AdminParent | null>(null);

  readonly approvalAssignments = signal<CourseAssignment[]>([]);
  readonly approvalChildIds = signal<number[]>([]);

  readonly enrollmentAssignments = signal<CourseAssignment[]>([]);
  readonly parentChildSelection = signal<number[]>([]);

  readonly newStudentForm = signal({
    full_name: '',
    email: '',
    password: '',
  });

  readonly studentOptions = computed(() =>
    this.students().map((student) => ({
      id: student.id,
      label: student.full_name?.trim() || student.email,
    }))
  );

  ngOnInit(): void {
    this.loadCourses();
    this.refreshPendingUsers();
    this.refreshStudents();
    this.refreshParents();
  }

  switchView(mode: 'pending' | 'students' | 'parents'): void {
    this.viewMode.set(mode);
  }

  refreshPendingUsers(): void {
    this.loadingPending.set(true);
    this.apiService.getPendingUsers().subscribe({
      next: (users) => {
        this.pendingUsers.set(users);
        this.loadingPending.set(false);
      },
      error: (error) => {
        console.error('Failed to load pending users', error);
        this.pendingUsers.set([]);
        this.loadingPending.set(false);
      },
    });
  }

  refreshStudents(): void {
    this.loadingStudents.set(true);
    this.apiService.getAdminStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        this.loadingStudents.set(false);
      },
      error: (error) => {
        console.error('Failed to load students', error);
        this.students.set([]);
        this.loadingStudents.set(false);
      },
    });
  }

  refreshParents(): void {
    this.loadingParents.set(true);
    this.apiService.getAdminParents().subscribe({
      next: (parents) => {
        this.parents.set(parents);
        this.loadingParents.set(false);
      },
      error: (error) => {
        console.error('Failed to load parents', error);
        this.parents.set([]);
        this.loadingParents.set(false);
      },
    });
  }

  openApprovalModal(user: PendingUser): void {
    this.selectedPendingUser.set(user);
    this.approvalAssignments.set(user.role === 'student' ? [this.createAssignmentRow()] : []);
    this.approvalChildIds.set([]);
    if (user.role === 'student') {
      this.ensureAssignmentsHaveClasses(this.approvalAssignments());
    }
    this.approvalModalOpen.set(true);
  }

  closeApprovalModal(): void {
    this.approvalModalOpen.set(false);
    this.selectedPendingUser.set(null);
    this.approvalAssignments.set([]);
    this.approvalChildIds.set([]);
  }

  addApprovalAssignment(): void {
    this.approvalAssignments.update((rows) => [...rows, this.createAssignmentRow()]);
  }

  removeApprovalAssignment(index: number): void {
    this.approvalAssignments.update((rows) => rows.filter((_, idx) => idx !== index));
  }

  updateApprovalCourse(index: number, courseId: number | null): void {
    this.approvalAssignments.update((rows) =>
      rows.map((row, idx) =>
        idx === index
          ? { courseId, classId: null }
          : row
      )
    );
    this.ensureClassesLoaded(courseId);
  }

  updateApprovalClass(index: number, classId: number | null): void {
    this.approvalAssignments.update((rows) =>
      rows.map((row, idx) => (idx === index ? { ...row, classId } : row))
    );
  }

  toggleApprovalChild(childId: number): void {
    this.approvalChildIds.update((current) => {
      if (current.includes(childId)) {
        return current.filter((id) => id !== childId);
      }
      return [...current, childId];
    });
  }

  submitApproval(): void {
    const user = this.selectedPendingUser();
    if (!user || this.approving()) {
      return;
    }

    const assignments = this.approvalAssignments()
      .filter((assignment) => assignment.courseId !== null)
      .map((assignment) => ({
        course_id: assignment.courseId!,
        class_id: assignment.classId ?? null,
      }));

    const payload: ApproveUserPayload = {
      activate: true,
    };

    if (assignments.length) {
      payload.course_assignments = assignments;
    }

    if (user.role === 'parent') {
      payload.child_ids = this.approvalChildIds();
    }

    this.approving.set(true);
    this.apiService.approveUser(user.id, payload).subscribe({
      next: () => {
        this.approving.set(false);
        this.closeApprovalModal();
        this.refreshPendingUsers();
        if (user.role === 'student') {
          this.refreshStudents();
        }
        if (user.role === 'parent') {
          this.refreshParents();
        }
      },
      error: (error) => {
        console.error('Failed to approve user', error);
        this.approving.set(false);
      },
    });
  }

  rejectPendingUser(user: PendingUser): void {
    if (!confirm(`Delete pending account for ${user.email}?`)) {
      return;
    }
    this.apiService.deleteUser(user.id).subscribe({
      next: () => this.refreshPendingUsers(),
      error: (error) => console.error('Failed to delete pending user', error),
    });
  }

  openEnrollmentModal(student: StudentAdmin): void {
    this.selectedStudent.set(student);
    const rows = student.enrollments.length
      ? student.enrollments.map((enrollment) => ({
          courseId: enrollment.course_id,
          classId: enrollment.class_id ?? null,
        }))
      : [this.createAssignmentRow()];
    this.enrollmentAssignments.set(rows);
    this.ensureAssignmentsHaveClasses(rows);
    this.enrollmentModalOpen.set(true);
  }

  closeEnrollmentModal(): void {
    this.enrollmentModalOpen.set(false);
    this.selectedStudent.set(null);
    this.enrollmentAssignments.set([]);
  }

  addEnrollmentAssignment(): void {
    this.enrollmentAssignments.update((rows) => [...rows, this.createAssignmentRow()]);
  }

  removeEnrollmentAssignment(index: number): void {
    this.enrollmentAssignments.update((rows) => rows.filter((_, idx) => idx !== index));
  }

  updateEnrollmentCourse(index: number, courseId: number | null): void {
    this.enrollmentAssignments.update((rows) =>
      rows.map((row, idx) =>
        idx === index
          ? { courseId, classId: null }
          : row
      )
    );
    this.ensureClassesLoaded(courseId);
  }

  updateEnrollmentClass(index: number, classId: number | null): void {
    this.enrollmentAssignments.update((rows) =>
      rows.map((row, idx) => (idx === index ? { ...row, classId } : row))
    );
  }

  saveEnrollmentAssignments(): void {
    const student = this.selectedStudent();
    if (!student || this.enrollmentSaving()) {
      return;
    }

    const assignments = this.enrollmentAssignments()
      .filter((assignment) => assignment.courseId !== null)
      .map((assignment) => ({
        course_id: assignment.courseId!,
        class_id: assignment.classId ?? null,
      }));

    this.enrollmentSaving.set(true);
    this.apiService
      .updateStudentEnrollments(student.id, {
        course_assignments: assignments,
      })
      .subscribe({
        next: (updated) => {
          this.students.update((current) =>
            current.map((existing) => (existing.id === updated.id ? updated : existing))
          );
          this.enrollmentSaving.set(false);
          this.closeEnrollmentModal();
        },
        error: (error) => {
          console.error('Failed to update enrollments', error);
          this.enrollmentSaving.set(false);
        },
      });
  }

  deleteStudent(student: StudentAdmin): void {
    if (!confirm(`Remove student ${student.email}?`)) {
      return;
    }
    this.apiService.deleteUser(student.id).subscribe({
      next: () => this.refreshStudents(),
      error: (error) => console.error('Failed to delete student', error),
    });
  }

  openParentModal(parent: AdminParent): void {
    this.selectedParent.set(parent);
    this.parentChildSelection.set(parent.children.map((child) => child.id));
    this.parentModalOpen.set(true);
  }

  closeParentModal(): void {
    this.parentModalOpen.set(false);
    this.selectedParent.set(null);
    this.parentChildSelection.set([]);
  }

  toggleParentChild(childId: number): void {
    this.parentChildSelection.update((current) => {
      if (current.includes(childId)) {
        return current.filter((id) => id !== childId);
      }
      return [...current, childId];
    });
  }

  saveParentChildren(): void {
    const parent = this.selectedParent();
    if (!parent || this.parentSaving()) {
      return;
    }

    this.parentSaving.set(true);
    this.apiService
      .updateParentChildren(parent.id, {
        child_ids: this.parentChildSelection(),
      })
      .subscribe({
        next: (updated) => {
          this.parents.update((current) =>
            current.map((existing) => (existing.id === updated.id ? updated : existing))
          );
          this.parentSaving.set(false);
          this.closeParentModal();
        },
        error: (error) => {
          console.error('Failed to update parent access', error);
          this.parentSaving.set(false);
        },
      });
  }

  openStudentModal(): void {
    this.newStudentForm.set({ full_name: '', email: '', password: '' });
    this.studentModalOpen.set(true);
  }

  closeStudentModal(): void {
    this.studentModalOpen.set(false);
  }

  updateNewStudentField(key: 'full_name' | 'email' | 'password', value: string): void {
    this.newStudentForm.update((form) => ({
      ...form,
      [key]: value,
    }));
  }

  saveStudent(): void {
    const form = this.newStudentForm();
    if (this.creatingStudent() || !form.email || !form.password || !form.full_name) {
      return;
    }

    const payload: CreateUserRequest = {
      email: form.email,
      password: form.password,
      full_name: form.full_name,
      role: 'student',
      is_active: true,
    };

    this.creatingStudent.set(true);
    this.apiService.createUser(payload).subscribe({
      next: () => {
        this.creatingStudent.set(false);
        this.closeStudentModal();
        this.refreshStudents();
      },
      error: (error) => {
        console.error('Failed to add student', error);
        this.creatingStudent.set(false);
      },
    });
  }

  courseTitle(courseId: number | null): string {
    if (!courseId) {
      return 'Unassigned';
    }
    return this.courses().find((course) => course.id === courseId)?.title ?? 'Unknown';
  }

  classOptionsForCourse(courseId: number | null): SchoolClass[] {
    if (!courseId) {
      return [];
    }
    return this.classesCache()[courseId] ?? [];
  }

  isClassLoading(courseId: number | null): boolean {
    if (!courseId) {
      return false;
    }
    return this.classesLoading()[courseId] ?? false;
  }

  private loadCourses(): void {
    if (this.courses().length) {
      return;
    }
    this.coursesLoading.set(true);
    this.apiService.getCourses().subscribe({
      next: (courses) => {
        this.courses.set(courses);
        this.coursesLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load courses', error);
        this.courses.set([]);
        this.coursesLoading.set(false);
      },
    });
  }

  private ensureAssignmentsHaveClasses(assignments: CourseAssignment[]): void {
    assignments.forEach((assignment) => this.ensureClassesLoaded(assignment.courseId));
  }

  private ensureClassesLoaded(courseId: number | null): void {
    if (!courseId) {
      return;
    }
    if (this.classesCache()[courseId]) {
      return;
    }

    this.classesLoading.update((current) => ({ ...current, [courseId]: true }));
    this.apiService.getCourseClasses(courseId).subscribe({
      next: (classes) => {
        this.classesCache.update((current) => ({ ...current, [courseId]: classes }));
        this.classesLoading.update((current) => ({ ...current, [courseId]: false }));
      },
      error: (error) => {
        console.error('Failed to load classes', error);
        this.classesCache.update((current) => ({ ...current, [courseId]: [] }));
        this.classesLoading.update((current) => ({ ...current, [courseId]: false }));
      },
    });
  }

  private createAssignmentRow(): CourseAssignment {
    return { courseId: null, classId: null };
  }
}
