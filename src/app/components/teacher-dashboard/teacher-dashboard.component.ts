import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <h4>Upload Test Questions (Excel)</h4>
        <input type="file" class="form-control" (change)="onFileSelected($event, 'test')" accept=".xlsx">
        <button class="btn btn-primary mt-2" (click)="uploadFile('test')" [disabled]="!selectedTestFile">Upload</button>
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
              <button class="btn btn-danger me-2" (click)="deleteTest(test.id)">Delete</button>
              <button class="btn btn-secondary me-2" (click)="toggleTestStatus(test.id)" [ngClass]="{'btn-success': test.isActive, 'btn-danger': !test.isActive}">
  {{ test.isActive ? 'Deactivate' : 'Activate' }}
</button>
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
      <div class="mb-3">
        <button class="btn btn-secondary" (click)="exportResults()" [disabled]="analytics.recentResults.length === 0">Export to CSV</button>
      </div>
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
    /* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');

body {
    background-color: #f4f7f6;
    font-family: 'Inter', sans-serif;
    color: #2c3e50;
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background-color: #ffffff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
}

h1 {
    color: #3498db;
    text-align: center;
    margin-bottom: 2rem;
    font-weight: 600;
    border-bottom: 3px solid #3498db;
    padding-bottom: 0.5rem;
}

.card {
    background-color: #ffffff;
    border: none;
    border-radius: 10px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    margin-bottom: 1.5rem;
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-5px);
}

.card-body {
    padding: 1.5rem;
}

.card-title {
    color: #2c3e50;
    font-weight: 600;
    margin-bottom: 1rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-control {
    border: 1px solid #bdc3c7;
    border-radius: 6px;
    padding: 0.75rem;
    transition: border-color 0.3s ease;
}

.form-control:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
}

.btn {
    border-radius: 6px;
    padding: 0.625rem 1.25rem;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: #3498db;
    border-color: #3498db;
}

.btn-primary:hover {
    background-color: #2980b9;
    border-color: #2980b9;
}

.btn-warning {
    background-color: #f39c12;
    border-color: #f39c12;
    color: white;
}

.btn-warning:hover {
    background-color: #d35400;
    border-color: #d35400;
}

.btn-danger {
    background-color: #e74c3c;
    border-color: #e74c3c;
}

.btn-danger:hover {
    background-color: #c0392b;
    border-color: #c0392b;
}

.btn-secondary {
    background-color: #95a5a6;
    border-color: #95a5a6;
}

.btn-secondary:hover {
    background-color: #7f8c8d;
    border-color: #7f8c8d;
}

.btn-success {
    background-color: #2ecc71;
    border-color: #2ecc71;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.chart-container {
    background-color: #f8f9fa;
    border-radius: 10px;
    padding: 1rem;
    margin-bottom: 1.5rem;
}

label {
    font-weight: 600;
    color: #34495e;
    margin-bottom: 0.5rem;
}

input[type="file"] {
    border: 1px dashed #bdc3c7;
    border-radius: 6px;
    padding: 0.75rem;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
    .container {
        padding: 1rem;
    }

    .card {
        margin-bottom: 1rem;
    }
}

/* Print Styles */
@media print {
    body {
        background-color: white;
    }
    
    .card {
        box-shadow: none;
        border: 1px solid #e0e0e0;
    }
}
  `]
})
export class TeacherDashboardComponent implements OnInit, AfterViewInit {
  analytics: any = { tests: [], totalTests: 0, totalStudents: 0, averageScore: 0, scoreDistribution: [], recentResults: [] };
  selectedTestFile: File | null = null;
  selectedMaterialFile: File | null = null;
  newTest = { title: '', duration: 0, category: 'General' };
  newMaterial = { title: '', course: '', category: '', topic: '' };

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

  ngAfterViewInit(): void {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return new HttpHeaders();
    }
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  loadDashboardData(): void {
    this.http.get<any>('http://localhost:5000/api/teacher/dashboard', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (data) => {
          this.analytics = data;
          this.setupCharts();
        },
        error: (err: HttpErrorResponse) => this.handleError(err, 'Error loading dashboard')
      });
  }

  toggleTestStatus(testId: number): void {
    this.http.put(`http://localhost:5000/api/tests/${testId}/toggle-status`, {}, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          alert('Test status updated');
          this.loadDashboardData();
        },
        error: (err) => this.handleError(err, 'Error toggling test status')
      });
  }

  setupCharts(): void {
    if (this.scoreChartCanvas) {
      this.scoreChart = new Chart(this.scoreChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
          datasets: [{ label: 'Students', data: this.analytics.scoreDistribution, backgroundColor: '#007bff' }]
        },
        options: { responsive: true, scales: { x: { title: { display: true, text: 'Score Range (%)' } }, y: { title: { display: true, text: 'Number of Students' } } } }
      });
    }
  }

  onFileSelected(event: any, type: 'test' | 'material'): void {
    if (type === 'test') this.selectedTestFile = event.target.files[0];
    else this.selectedMaterialFile = event.target.files[0];
  }

  uploadFile(type: 'test'): void {
    if (type === 'test' && this.selectedTestFile) {
      const formData = new FormData();
      formData.append('file', this.selectedTestFile);
      this.http.post('http://localhost:5000/api/tests/upload', formData, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            alert('Test uploaded successfully');
            this.loadDashboardData();
            this.selectedTestFile = null;
          },
          error: (err) => this.handleError(err, 'Upload failed')
        });
    }
  }

  createTest(): void {
    const testData = { title: this.newTest.title, duration: this.newTest.duration, questions: [], category: this.newTest.category };
    this.http.post('http://localhost:5000/api/tests/create', testData, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (response: any) => {
          alert('Test created successfully');
          this.loadDashboardData();
          this.router.navigate(['/teacher/edit-test', response.id]);
          this.newTest = { title: '', duration: 0, category: 'General' };
        },
        error: (err) => this.handleError(err, 'Test creation failed')
      });
  }

  uploadMaterial(): void {
    if (this.selectedMaterialFile) {
      const formData = new FormData();
      formData.append('file', this.selectedMaterialFile);
      formData.append('title', this.newMaterial.title);
      formData.append('course', this.newMaterial.course);
      formData.append('category', this.newMaterial.category);
      formData.append('topic', this.newMaterial.topic);
      this.http.post('http://localhost:5000/api/teacher/upload-material', formData, { headers: this.getAuthHeaders() })
        .subscribe({
          next: () => {
            alert('Material uploaded successfully');
            this.newMaterial = { title: '', course: '', category: '', topic: '' };
            this.selectedMaterialFile = null;
          },
          error: (err) => this.handleError(err, 'Material upload failed')
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
          error: (err) => this.handleError(err, 'Delete failed')
        });
    }
  }

  viewStudentResults(testId: number): void {
    this.router.navigate(['/teacher/test-results', testId]);
  }

  exportResults(): void {
    const csvData = this.convertToCSV(this.analytics.recentResults);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher_results_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(results: any[]): string {
    const headers = ['Test Title', 'Student', 'Score', 'Total', 'Percentage'];
    const rows = results.map(r => [r.testTitle, r.student, r.score, r.total, `${r.percentage.toFixed(2)}%`]);
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private handleError(err: HttpErrorResponse, message: string): void {
    console.error(`${message}:`, err);
    alert(`Error: ${err.error?.message || err.message}`);
    if (err.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}