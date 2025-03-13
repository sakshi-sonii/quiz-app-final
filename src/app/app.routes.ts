import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { StudentDashboardComponent } from './components/student-dashboard/student-dashboard.component';
import { TestAttemptComponent } from './components/test-attempt/test-attempt.component';
import { StudentResultsComponent } from './components/student-results/student-results.component';
import { TeacherDashboardComponent } from './components/teacher-dashboard/teacher-dashboard.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'student', 
    component: StudentDashboardComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'Student' } 
  },
  { 
    path: 'test/:id', 
    component: TestAttemptComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'Student' } 
  },
  { 
    path: 'student/results/:id', 
    component: StudentResultsComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'Student' } 
  },
  { 
    path: 'teacher', 
    component: TeacherDashboardComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'Teacher' } 
  },
  { 
    path: 'admin', 
    component: AdminDashboardComponent, 
    canActivate: [AuthGuard], 
    data: { role: 'Admin' } 
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];