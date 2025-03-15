import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Adjust path as needed
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <h1>Student Dashboard</h1>

      <!-- Summary -->
      <div class="card mb-4">
        <div class="card-body">
          <h3>Your Performance</h3>
          <p>Average Score: {{ analytics.averageScore | number:'1.2-2' }}%</p>
          <p>Tests Taken: {{ analytics.recentResults.length }}</p>
          <p>Available Tests: {{ tests.length }}</p>
        </div>
      </div>

      <!-- Available Tests -->
      <h2>Available Tests</h2>
      <div class="row" *ngIf="tests.length > 0; else noTests">
        <div class="col-md-4" *ngFor="let test of tests">
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">{{ test.title }}</h5>
              <p class="card-text">Duration: {{ test.duration }} minutes</p>
              <p class="card-text">Teacher: {{ test.teacher }}</p>
              <button class="btn btn-primary" (click)="startTest(test.id)">Start Test</button>
            </div>
          </div>
        </div>
      </div>
      <ng-template #noTests>
        <p>No available tests at this time.</p>
      </ng-template>

      <!-- Recent Results -->
      <h2>Recent Results</h2>
      <div class="row" *ngIf="analytics.recentResults.length > 0; else noResults">
        <div class="col-md-6" *ngFor="let result of analytics.recentResults">
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">{{ result.testTitle }}</h5>
              <p class="card-text">Score: {{ result.score }} / {{ result.total }} ({{ result.percentage | number:'1.2-2' }}%)</p>
              <button class="btn btn-info" (click)="viewResult(result.testId)">View Details</button>
            </div>
          </div>
        </div>
      </div>
      <ng-template #noResults>
        <p>No recent results available.</p>
      </ng-template>

      <!-- Performance Trend Chart -->
      <h2>Performance Trend</h2>
      <div class="chart-container">
        <canvas #trendChartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; }
    .card { box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .chart-container { position: relative; height: 400px; width: 100%; margin-bottom: 20px; }
    .btn-primary { background-color: #007bff; border: none; }
    .btn-info { background-color: #17a2b8; border: none; }
  `]
})
export class StudentDashboardComponent implements OnInit, AfterViewInit {
  tests: any[] = [];
  analytics: any = {
    averageScore: 0,
    recentResults: [],
    performanceTrend: []
  };

  @ViewChild('trendChartCanvas') trendChartCanvas!: ElementRef<HTMLCanvasElement>;
  private trendChart!: Chart<'line'>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || !this.authService.isRole('Student')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Chart initialized after data is loaded
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
    this.http.get<any>('http://localhost:5000/api/student/dashboard', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          console.log('Dashboard Data:', data); // Debug output
          this.tests = data.availableTests || [];
          this.analytics = {
            averageScore: data.averageScore || 0,
            recentResults: data.recentResults || [],
            performanceTrend: data.performanceTrend || []
          };
          this.setupCharts();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error loading dashboard data:', err);
          if (err.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          }
          // Fallback to original endpoint for debugging
          this.loadTestsFallback();
        }
      });
  }

  // Fallback to original GET /api/tests
  loadTestsFallback(): void {
    this.http.get<any[]>('http://localhost:5000/api/tests', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (tests) => {
          console.log('Fallback Tests:', tests);
          this.tests = tests;
          this.analytics = { averageScore: 0, recentResults: [], performanceTrend: [] };
          this.setupCharts();
        },
        error: (err) => console.error('Fallback failed:', err)
      });
  }

  setupCharts(): void {
    if (this.trendChartCanvas) {
      this.trendChart = new Chart(this.trendChartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: this.analytics.performanceTrend.map((_: number, i: number) => `Test ${i + 1}`),
          datasets: [{
            label: 'Score (%)',
            data: this.analytics.performanceTrend,
            borderColor: '#007bff',
            fill: false
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: { title: { display: true, text: 'Tests' } },
            y: { 
              title: { display: true, text: 'Score (%)' },
              min: 0,
              max: 100
            }
          }
        }
      });
    }
  }

  startTest(testId: number): void {
    this.router.navigate(['/test', testId]);
  }

  viewResult(testId: number): void {
    this.router.navigate(['/student-result', testId]);
  }
}