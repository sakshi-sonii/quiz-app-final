import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <h1>Student Dashboard</h1>
      <button class="btn btn-danger mb-3" (click)="logout()">Logout</button>

      <!-- Summary -->
      <div class="card mb-4">
        <div class="card-body">
          <h3>Your Performance</h3>
          <p>Average Score: {{ analytics.averageScore | number:'1.2-2' }}%</p>
          <p>Tests Taken: {{ analytics.recentResults.length }}</p>
          <p>Available Tests: {{ tests.length }}</p>
        </div>
      </div>

      <!-- Progress Tracker -->
      <h2>Progress</h2>
      <div class="chart-container mb-4">
        <canvas #progressChartCanvas></canvas>
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
      <ng-template #noTests><p>No available tests at this time.</p></ng-template>

      <!-- Course Lectures/Notes -->
      <h2>Course Materials</h2>
      <div class="row" *ngIf="courseMaterials.length > 0; else noMaterials">
        <div class="col-md-6" *ngFor="let material of courseMaterials">
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">{{ material.title }}</h5>
              <p class="card-text">Teacher: {{ material.teacher }}</p>
              <p class="card-text">Course: {{ material.course }}</p>
              <p class="card-text">Category: {{ material.category }}</p>
              <p class="card-text">Topic: {{ material.topic }}</p>
              <a [href]="material.fileUrl" target="_blank" class="btn btn-info">Download</a>
            </div>
          </div>
        </div>
      </div>
      <ng-template #noMaterials><p>No course materials available.</p></ng-template>

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
      <ng-template #noResults><p>No recent results available.</p></ng-template>

      <!-- Test Details Modal -->
      <div class="modal" [ngClass]="{'d-block': showDetails}" tabindex="-1">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ selectedResult?.testTitle }} Details</h5>
              <button type="button" class="btn-close" (click)="showDetails = false"></button>
            </div>
            <div class="modal-body" *ngIf="selectedResult">
              <p>Teacher: {{ selectedResult.teacher }}</p>
              <p>Score: {{ selectedResult.score }} / {{ selectedResult.total }} ({{ selectedResult.percentage | number:'1.2-2' }}%)</p>
              <h6>Questions:</h6>
              <ul>
                <li *ngFor="let q of selectedResult.questions">
                  {{ q.text }} - 
                  <span [ngClass]="{'text-success': q.isCorrect, 'text-danger': !q.isCorrect}">
                    {{ q.isCorrect ? 'Correct' : 'Incorrect' }}
                  </span>
                </li>
              </ul>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showDetails = false">Close</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Trend Chart -->
      <h2>Performance Trend</h2>
      <div class="chart-container">
        <canvas #trendChartCanvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    // Student Dashboard SCSS

// Variables
$primary-color: #4361ee;
$secondary-color: #3a0ca3;
$accent-color: #4cc9f0;
$danger-color: #f72585;
$warning-color: #ffc107;
$success-color: #2ec4b6;
$info-color: #4895ef;
$text-primary: #2b2d42;
$text-secondary: #6c757d;
$light-bg: #f8f9fa;
$medium-bg: #e9ecef;
$card-bg: #ffffff;
$border-color: #dee2e6;
$box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
$border-radius: 10px;

// Base Styles
body {
  font-family: 'Poppins', 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f8ff;
  color: $text-primary;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  padding: 0 20px;
}

// Page Header
h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: $primary-color;
  margin-bottom: 1.5rem;
  position: relative;
  display: inline-block;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 80px;
    height: 4px;
    background: linear-gradient(to right, $primary-color, $accent-color);
    border-radius: 2px;
  }
}

h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: $secondary-color;
  margin: 1.5rem 0 1rem;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 50px;
    height: 3px;
    background: $accent-color;
    border-radius: 1.5px;
  }
}

// Cards
.card {
  border: none;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  }
  
  .card-body {
    padding: 1.5rem;
  }
  
  .card-title {
    font-weight: 600;
    color: $primary-color;
    margin-bottom: 1rem;
  }
  
  .card-text {
    color: $text-secondary;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
    
    &:last-child {
      margin-bottom: 1rem;
    }
  }
}

// Summary Card
.card:first-of-type {
  background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
  margin-bottom: 2rem;
  
  h3 {
    color: white;
    font-weight: 600;
    margin-bottom: 1.2rem;
  }
  
  p {
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.1rem;
    margin-bottom: 0.8rem;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

// Buttons
.btn {
  border-radius: 50px;
  padding: 0.5rem 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
  border: none;
  
  &:focus {
    box-shadow: 0 0 0 0.25rem rgba($primary-color, 0.25);
  }
}

.btn-primary {
  background-color: $primary-color;
  color: white;
  
  &:hover {
    background-color: darken($primary-color, 8%);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.btn-danger {
  background-color: $danger-color;
  color: white;
  
  &:hover {
    background-color: darken($danger-color, 8%);
  }
}

.btn-info {
  background-color: $info-color;
  color: white;
  
  &:hover {
    background-color: darken($info-color, 8%);
  }
}

.btn-secondary {
  background-color: $medium-bg;
  color: $text-secondary;
  
  &:hover {
    background-color: darken($medium-bg, 5%);
    color: $text-primary;
  }
}

// Logout Button
.btn-danger.mb-3 {
  position: absolute;
  right: 20px;
  top: 20px;
}

// Chart Containers
.chart-container {
  background-color: $card-bg;
  border-radius: $border-radius;
  padding: 20px;
  box-shadow: $box-shadow;
  margin-bottom: 2rem;
  height: 300px;
}

// Available Tests
.row {
  margin-right: -10px;
  margin-left: -10px;
  
  .col-md-4, .col-md-6 {
    padding-right: 10px;
    padding-left: 10px;
  }
}

// Result Cards
.col-md-6 .card {
  height: 100%;
  border-left: 5px solid $accent-color;
  
  // Styling for result cards
  .card-body p:nth-child(2) {
    font-weight: 600;
    font-size: 1.1rem;
    color: $primary-color;
  }
}

// Test Cards
.col-md-4 .card {
  height: 100%;
  border-left: 5px solid $primary-color;
}

// Course Materials
.col-md-6 .card {
  &:has(.btn-info) {
    border-left: 5px solid $info-color;
  }
}

// Modal
.modal {
  background-color: rgba(0, 0, 0, 0.5);
  
  .modal-content {
    border-radius: $border-radius;
    border: none;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
  
  .modal-header {
    border-bottom: 1px solid $border-color;
    background-color: $primary-color;
    color: white;
    border-top-left-radius: $border-radius;
    border-top-right-radius: $border-radius;
    
    .modal-title {
      font-weight: 600;
    }
    
    .btn-close {
      filter: brightness(0) invert(1);
    }
  }
  
  .modal-body {
    padding: 1.5rem;
    
    p {
      margin-bottom: 0.8rem;
    }
    
    h6 {
      font-weight: 600;
      margin-top: 1rem;
      margin-bottom: 0.8rem;
    }
    
    ul {
      padding-left: 1.2rem;
      
      li {
        margin-bottom: 0.5rem;
      }
    }
  }
  
  .modal-footer {
    border-top: 1px solid $border-color;
    padding: 1rem 1.5rem;
  }
}

// Text Colors
.text-success {
  color: $success-color !important;
  font-weight: 600;
}

.text-danger {
  color: $danger-color !important;
  font-weight: 600;
}

// Empty State Messages
ng-template p {
  background-color: $light-bg;
  padding: 1.5rem;
  border-radius: $border-radius;
  color: $text-secondary;
  text-align: center;
  font-style: italic;
}

// Responsive Adjustments
@media (max-width: 768px) {
  .btn-danger.mb-3 {
    position: relative;
    right: auto;
    top: auto;
    margin-bottom: 1.5rem !important;
    display: block;
  }
  
  h1 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .card:first-of-type {
    p {
      font-size: 1rem;
    }
  }
}

// Animations
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.row > div {
  animation: fadeIn 0.5s ease-out;
}

@for $i from 1 through 10 {
  .row > div:nth-child(#{$i}) {
    animation-delay: #{$i * 0.05}s;
  }
}

// Progress Indicators
.progress {
  height: 10px;
  border-radius: 5px;
  margin-bottom: 1rem;
  background-color: $light-bg;
  
  .progress-bar {
    background: linear-gradient(to right, $primary-color, $accent-color);
    border-radius: 5px;
    transition: width 1s ease;
  }
}
  `]
})
export class StudentDashboardComponent implements OnInit, AfterViewInit {
  tests: any[] = [];
  courseMaterials: any[] = [];
  analytics: any = { averageScore: 0, recentResults: [], performanceTrend: [] };
  selectedResult: any = null;
  showDetails: boolean = false;

  @ViewChild('trendChartCanvas') trendChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('progressChartCanvas') progressChartCanvas!: ElementRef<HTMLCanvasElement>;
  private trendChart!: Chart<'line'>;
  private progressChart!: Chart<'bar'>;

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
    this.loadCourseMaterials();
  }

  ngAfterViewInit(): void {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      alert('Session expired. Please log in again.');
      this.router.navigate(['/login']);
      return new HttpHeaders();
    }
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadDashboardData(): void {
    this.http.get<any>('http://localhost:5000/api/student/dashboard', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          this.tests = data.availableTests || [];
          this.analytics = {
            averageScore: data.averageScore || 0,
            recentResults: data.recentResults || [],
            performanceTrend: data.performanceTrend || []
          };
          this.setupCharts();
        },
        error: (err: HttpErrorResponse) => this.handleError(err, 'Error loading dashboard data')
      });
  }

  loadCourseMaterials(): void {
    this.http.get<any[]>('http://localhost:5000/api/student/course-materials', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (materials) => this.courseMaterials = materials,
        error: (err) => console.error('Error loading course materials:', err)
      });
  }

  setupCharts(): void {
    if (this.trendChartCanvas) {
      this.trendChart = new Chart(this.trendChartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: this.analytics.performanceTrend.map((_: number, i: number) => `Test ${i + 1}`),
          datasets: [{ label: 'Score (%)', data: this.analytics.performanceTrend, borderColor: '#007bff', fill: false }]
        },
        options: { responsive: true, scales: { x: { title: { display: true, text: 'Tests' } }, y: { title: { display: true, text: 'Score (%)' }, min: 0, max: 100 } } }
      });
    }
    if (this.progressChartCanvas) {
      this.progressChart = new Chart(this.progressChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Completed', 'Remaining'],
          datasets: [{ label: 'Tests', data: [this.analytics.recentResults.length, this.tests.length], backgroundColor: ['#28a745', '#007bff'] }]
        },
        options: { responsive: true, scales: { y: { title: { display: true, text: 'Number of Tests' } } } }
      });
    }
  }

  startTest(testId: number): void {
    this.router.navigate(['/test', testId]);
  }

  viewResult(testId: number): void {
    this.http.get<any>(`http://localhost:5000/api/student/results/${testId}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (result) => {
          this.selectedResult = result;
          this.showDetails = true;
        },
        error: (err: HttpErrorResponse) => {
          if (err.status === 400 && err.error.message) {
            alert(err.error.message);
          } else {
            this.handleError(err, 'Error fetching result details');
          }
        }
      });
  }

  viewAllResults(): void {
    this.http.get<any>('http://localhost:5000/api/student/all-results', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (results) => {
          console.log('All Results:', results);
          this.router.navigate(['/student/all-results'], { state: { results } });
        },
        error: (err: HttpErrorResponse) => this.handleError(err, 'Error fetching all results')
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private handleError(err: HttpErrorResponse, message: string): void {
    console.error(`${message}:`, err);
    if (err.status === 401) {
      alert('Session expired or unauthorized. Please log in again.');
    } else if (err.status === 404) {
      alert('Resource not found.');
    } else {
      alert(`Error: ${err.error?.message || err.message}`);
    }
  }
}