import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <h1>Teacher Dashboard</h1>

      <!-- Summary -->
      <div class="card mb-4">
        <div class="card-body">
          <h3>Performance Overview</h3>
          <p>Total Tests: {{ analytics.totalTests }}</p>
          <p>Total Students: {{ analytics.totalStudents }}</p>
          <p>Average Student Score: {{ analytics.averageScore | number:'1.2-2' }}%</p>
        </div>
      </div>

      <!-- Upload Test -->
      <div class="mb-4">
        <h4>Upload Test Questions</h4>
        <input type="file" class="form-control" (change)="onFileSelected($event)" accept=".xlsx">
        <button class="btn btn-primary mt-2" (click)="uploadFile()" [disabled]="!selectedFile">Upload</button>
      </div>

      <!-- Manage Tests -->
      <h4>Manage Tests</h4>
      <div class="row" *ngIf="analytics.tests.length > 0; else noTests">
        <div class="col-md-4" *ngFor="let test of analytics.tests">
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">{{ test.title }}</h5>
              <p class="card-text">Duration: {{ test.duration }} minutes</p>
              <p class="card-text">Students: {{ test.studentCount }}</p>
              <p class="card-text">Avg Score: {{ test.averageScore | number:'1.2-2' }}%</p>
              <button class="btn btn-warning me-2" (click)="editTest(test.id)">Edit</button>
              <button class="btn btn-danger" (click)="deleteTest(test.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>
      <ng-template #noTests><p>No tests available.</p></ng-template>

      <!-- Score Distribution Chart -->
      <h4>Student Score Distribution</h4>
      <div class="chart-container">
        <canvas #scoreChartCanvas></canvas>
      </div>

      <!-- Recent Results -->
      <h4>Recent Student Results</h4>
      <div class="row" *ngIf="analytics.recentResults.length > 0; else noResults">
        <div class="col-md-6" *ngFor="let result of analytics.recentResults">
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">{{ result.testTitle }}</h5>
              <p class="card-text">Student: {{ result.student }}</p>
              <p class="card-text">Score: {{ result.score }} / {{ result.total }} ({{ result.percentage | number:'1.2-2' }}%)</p>
            </div>
          </div>
        </div>
      </div>
      <ng-template #noResults><p>No recent results available.</p></ng-template>
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; }
    .card { box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .chart-container { position: relative; height: 400px; width: 100%; margin-bottom: 20px; }
    .btn-primary { background-color: #007bff; border: none; }
    .btn-warning { background-color: #ffc107; border: none; }
    .btn-danger { background-color: #dc3545; border: none; }
  `]
})
export class TeacherDashboardComponent implements OnInit, AfterViewInit {
  analytics: any = {
    tests: [],
    totalTests: 0,
    totalStudents: 0,
    averageScore: 0,
    scoreDistribution: [],
    recentResults: []
  };
  selectedFile: File | null = null;

  @ViewChild('scoreChartCanvas') scoreChartCanvas!: ElementRef<HTMLCanvasElement>;
  private scoreChart!: Chart<'bar'>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || !this.authService.isRole('Teacher')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Chart initialized after data load
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return new HttpHeaders();
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadDashboardData(): void {
    this.http.get<any>('http://localhost:5000/api/teacher/dashboard', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          console.log('Teacher Dashboard Data:', data); // Debug
          this.analytics = data;
          this.setupCharts();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error loading dashboard:', err);
          if (err.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          // Fallback to existing endpoints
          this.loadTests();
          this.loadPerformance();
        }
      });
  }

  loadTests(): void {
    this.http.get<any[]>('http://localhost:5000/api/tests/teacher', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (tests) => {
          this.analytics.tests = tests;
        },
        error: (err) => console.error('Error loading tests:', err)
      });
  }

  loadPerformance(): void {
    this.http.get<any>('http://localhost:5000/api/performance/teacher', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (performance) => {
          this.analytics.totalStudents = performance.totalStudents;
          this.analytics.averageScore = performance.averageScore; // Note: This is raw score, not percentage
        },
        error: (err) => console.error('Error loading performance:', err)
      });
  }

  setupCharts(): void {
    if (this.scoreChartCanvas) {
      this.scoreChart = new Chart(this.scoreChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
          datasets: [{
            label: 'Students',
            data: this.analytics.scoreDistribution,
            backgroundColor: '#007bff'
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: { title: { display: true, text: 'Score Range (%)' } },
            y: { title: { display: true, text: 'Number of Students' } }
          }
        }
      });
    }
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
            this.loadDashboardData();
            this.selectedFile = null;
          },
          error: (err) => {
            console.error('Upload failed', err);
            if (err.status === 401) {
              this.authService.logout();
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
            this.loadDashboardData();
          },
          error: (err) => {
            console.error('Delete failed', err);
            if (err.status === 401) {
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          }
        });
    }
  }
}