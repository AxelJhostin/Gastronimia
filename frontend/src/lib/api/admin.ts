import { apiFetch } from './http';

export interface AdminUser {
  id: string;
  email: string;
  roles: ('ADMIN' | 'MANAGER' | 'TEACHER')[];
}

export interface AcademicPeriod {
  id?: string;
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface Subject {
  id?: string;
  code: string;
  name: string;
}

export interface Laboratory {
  id?: string;
  code: string;
  name: string;
  location?: string;
}

export interface TeacherProfile {
  id?: string;
  user_id: string;
  employee_code: string;
}

export interface CourseSection {
  id?: string;
  period_id: string;
  subject_id: string;
  teacher_id: string;
  laboratory_id: string;
  code: string;
}

export const adminApi = {
  // Usuarios y Roles
  getUsers: () => apiFetch<AdminUser[]>('/admin/users'),
  updateUserRoles: (userId: string, roles: string[]) =>
    apiFetch<AdminUser>(`/admin/users/${userId}/roles`, {
      method: 'PUT',
      body: JSON.stringify({ roles }),
    }),

  // Períodos Académicos
  getPeriods: () => apiFetch<AcademicPeriod[]>('/admin/academic/periods'),
  createPeriod: (data: AcademicPeriod) =>
    apiFetch<AcademicPeriod>('/admin/academic/periods', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Materias
  getSubjects: () => apiFetch<Subject[]>('/admin/academic/subjects'),
  createSubject: (data: Subject) =>
    apiFetch<Subject>('/admin/academic/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Laboratorios / Talleres
  getLaboratories: () => apiFetch<Laboratory[]>('/admin/academic/laboratories'),
  createLaboratory: (data: Laboratory) =>
    apiFetch<Laboratory>('/admin/academic/laboratories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Perfiles Docentes
  getTeachers: () => apiFetch<TeacherProfile[]>('/admin/academic/teachers'),
  createTeacher: (data: TeacherProfile) =>
    apiFetch<TeacherProfile>('/admin/academic/teachers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Secciones / Cursos
  getSections: () => apiFetch<CourseSection[]>('/admin/academic/course-sections'),
  createSection: (data: CourseSection) =>
    apiFetch<CourseSection>('/admin/academic/course-sections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};