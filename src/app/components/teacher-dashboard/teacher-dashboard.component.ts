import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Import HttpHeaders
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Import AuthService

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <h2>Teacher Dashboard</h2>
      <div class="mb-3">
        <h4>Upload Test Questions</h4>
        <input type="file" class="form-control" (change)="onFileSelected($event)" accept=".xlsx">
        <button class="btn btn-primary mt-2" (click)="uploadFile()" [disabled]="!selectedFile">Upload</button>
      </div>
      <h4>Manage Tests</h4>
      <div class="row">
        <div class="col-md-4" *ngFor="let test of tests">
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">{{ test.title }}</h5>
              <button class="btn btn-warning me-2" (click)="editTest(test.id)">Edit</button>
              <button class="btn btn-danger" (click)="deleteTest(test.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
      <h4>Student Performance</h4>
      <div class="card">
        <div class="card-body">
          <p>Average Score: {{ performance.averageScore }}</p>
          <p>Total Students: {{ performance.totalStudents }}</p>
        </div>
      </div>
    </div>
  `
})
export class TeacherDashboardComponent implements OnInit {
  tests: any[] = [];
  performance: any = {};
  selectedFile: File | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService // Inject AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']); // Redirect if not logged in
      return;
    }
    this.loadTests();
    this.loadPerformance();
  }

  // Helper method to get headers with token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadTests(): void {
    this.http.get<any[]>('http://localhost:5000/api/tests/teacher', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (tests) => {
          this.tests = tests;
        },
        error: (err) => {
          console.error('Error loading tests:', err);
          if (err.status === 401) {
            this.router.navigate(['/login']); // Redirect on unauthorized
          }
        }
      });
  }

  loadPerformance(): void {
    this.http.get<any>('http://localhost:5000/api/performance/teacher', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (performance) => {
          this.performance = performance;
        },
        error: (err) => {
          console.error('Error loading performance:', err);
          if (err.status === 401) {
            this.router.navigate(['/login']); // Redirect on unauthorized
          }
        }
      });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  uploadFile(): void {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      this.http.post('http://localhost:5000/api/tests/upload', formData, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            alert('Test uploaded successfully');
            this.loadTests();
            this.selectedFile = null;
          },
          error: (err) => {
            console.error('Upload failed', err);
            if (err.status === 401) {
              this.router.navigate(['/login']);
            }
          }
        });
    }
  }

  editTest(testId: number): void {
    this.router.navigate(['/teacher/edit-test', testId]);
  }

  deleteTest(testId: number): void {
    if (confirm('Are you sure you want to delete this test?')) {
      this.http.delete(`http://localhost:5000/api/tests/${testId}`, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            alert('Test deleted successfully');
            this.loadTests();
          },
          error: (err) => {
            console.error('Delete failed', err);
            if (err.status === 401) {
              this.router.navigate(['/login']);
            }
          }
        });
    }
  }
}