import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule,FormsModule],
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
      <h4>Create Mock Test</h4>
      <form (ngSubmit)="createTest()">
        <div class="mb-3">
          <label for="testTitle" class="form-label">Test Title</label>
          <input type="text" class="form-control" id="testTitle" [(ngModel)]="newTest.title" name="title" required>
        </div>
        <div class="mb-3">
          <label for="testDuration" class="form-label">Duration (minutes)</label>
          <input type="number" class="form-control" id="testDuration" [(ngModel)]="newTest.duration" name="duration" required>
        </div>
        <button type="submit" class="btn btn-primary">Create Test</button>
      </form>
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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTeachers();
    this.loadAnalytics();
  }

  loadTeachers(): void {
    this.http.get<any[]>('http://localhost:5000/api/admin/teachers').subscribe(teachers => {
      this.teachers = teachers;
    });
  }

  loadAnalytics(): void {
    this.http.get<any>('http://localhost:5000/api/admin/analytics').subscribe(analytics => {
      this.analytics = analytics;
    });
  }

  addTeacher(): void {
    this.http.post('http://localhost:5000/api/admin/teachers', this.newTeacher).subscribe({
      next: () => {
        alert('Teacher added successfully');
        this.loadTeachers();
        this.newTeacher = { username: '', password: '' };
      },
      error: (err) => console.error('Add teacher failed', err)
    });
  }

  deleteTeacher(teacherId: number): void {
    if (confirm('Are you sure you want to delete this teacher?')) {
      this.http.delete(`http://localhost:5000/api/admin/teachers/${teacherId}`).subscribe({
        next: () => {
          alert('Teacher deleted successfully');
          this.loadTeachers();
        },
        error: (err) => console.error('Delete teacher failed', err)
      });
    }
  }

  createTest(): void {
    this.http.post('http://localhost:5000/api/admin/tests', this.newTest).subscribe({
      next: () => {
        alert('Test created successfully');
        this.newTest = { title: '', duration: 0 };
      },
      error: (err) => console.error('Create test failed', err)
    });
  }
}