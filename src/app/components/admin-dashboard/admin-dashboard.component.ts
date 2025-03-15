// src/app/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; // Import AuthService
import { Router } from '@angular/router'; // Import Router

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-5">
      <h2>Admin Dashboard</h2>
      <div class="mb-3">
        <h4>Add Teacher</h4>
        <form (ngSubmit)="addTeacher()">
          <div class="mb-3">
            <label for="teacherUsername" class="form-label">Username</label>
            <input type="text" class="form-control" id="teacherUsername" [(ngModel)]="newTeacher.username" name="username" required>
          </div>
          <div class="mb-3">
            <label for="teacherPassword" class="form-label">Password</label>
            <input type="password" class="form-control" id="teacherPassword" [(ngModel)]="newTeacher.password" name="password" required>
          </div>
          <button type="submit" class="btn btn-primary">Add Teacher</button>
        </form>
      </div>
      <h4>Manage Teachers</h4>
      <div class="row">
        <div class="col-md-4" *ngFor="let teacher of teachers">
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">{{ teacher.username }}</h5>
              <button class="btn btn-danger" (click)="deleteTeacher(teacher.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
      
      <h4>Overall Performance Analytics</h4>
      <div class="card">
        <div class="card-body">
          <p>Average Score: {{ analytics.averageScore }}</p>
          <p>Total Tests: {{ analytics.totalTests }}</p>
          <p>Total Students: {{ analytics.totalStudents }}</p>
        </div>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  teachers: any[] = [];
  newTeacher = { username: '', password: '' };
  newTest = { title: '', duration: 0 };
  analytics: any = {};

  constructor(
    private http: HttpClient,
    private authService: AuthService, // Inject AuthService
    private router: Router // Inject Router
  ) {}

  ngOnInit(): void {
    // Check if user is logged in and has the Admin role
    if (!this.authService.isLoggedIn() || !this.authService.isRole('Admin')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadTeachers();
    this.loadAnalytics();
  }

  // Helper method to get HTTP headers with the Authorization token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      // If no token, redirect to login
      this.authService.logout();
      this.router.navigate(['/login']);
      return new HttpHeaders();
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  loadTeachers(): void {
    const headers = this.getAuthHeaders();
    this.http.get<any[]>('http://localhost:5000/api/admin/teachers', { headers }).subscribe({
      next: (teachers) => {
        this.teachers = teachers;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading teachers:', err);
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  loadAnalytics(): void {
    const headers = this.getAuthHeaders();
    this.http.get<any>('http://localhost:5000/api/admin/analytics', { headers }).subscribe({
      next: (analytics) => {
        this.analytics = analytics;
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error loading analytics:', err);
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  addTeacher(): void {
    const headers = this.getAuthHeaders();
    this.http.post('http://localhost:5000/api/admin/teachers', this.newTeacher, { headers }).subscribe({
      next: () => {
        alert('Teacher added successfully');
        this.loadTeachers();
        this.newTeacher = { username: '', password: '' };
      },
      error: (err: HttpErrorResponse) => {
        console.error('Add teacher failed', err);
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }

  deleteTeacher(teacherId: number): void {
    if (confirm('Are you sure you want to delete this teacher?')) {
      const headers = this.getAuthHeaders();
      this.http.delete(`http://localhost:5000/api/admin/teachers/${teacherId}`, { headers }).subscribe({
        next: () => {
          alert('Teacher deleted successfully');
          this.loadTeachers();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Delete teacher failed', err);
          if (err.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      });
    }
  }

  createTest(): void {
    const headers = this.getAuthHeaders();
    this.http.post('http://localhost:5000/api/admin/tests', this.newTest, { headers }).subscribe({
      next: () => {
        alert('Test created successfully');
        this.newTest = { title: '', duration: 0 };
      },
      error: (err: HttpErrorResponse) => {
        console.error('Create test failed', err);
        if (err.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
      }
    });
  }
}