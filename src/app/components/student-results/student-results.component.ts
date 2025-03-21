import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Chart from 'chart.js/auto';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-student-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <h1>Test Results</h1>
      <div class="card" *ngIf="result.testId; else loading">
        <div class="card-body">
          <h5 class="card-title">{{ result.testTitle }}</h5>
          <p class="card-text">Teacher: {{ result.teacher }}</p>
          <p class="card-text">Score: {{ result.score }} / {{ result.total }} ({{ result.percentage | number:'1.2-2' }}%)</p>
          <button class="btn btn-secondary mb-3" (click)="downloadPDF()">Download as PDF</button>

          <h5>Question Breakdown</h5>
          <ul>
            <li *ngFor="let q of result.questions; let i = index">
              {{ q.text }}: 
              <span [ngClass]="{'text-success': q.isCorrect, 'text-danger': !q.isCorrect}">
                {{ q.isCorrect ? 'Correct' : 'Incorrect' }} 
                (Selected: {{ q.selectedOption }}, Correct: {{ q.correctOption }})
              </span>
            </li>
          </ul>

          <h5>Performance Analysis</h5>
          <div class="chart-container">
            <canvas #pieChartCanvas></canvas>
          </div>

          <h5>Comparison to Average</h5>
          <div class="chart-container">
            <canvas #barChartCanvas></canvas>
          </div>

          <h5>Teacher Feedback</h5>
          <p>{{ feedback || 'No feedback provided yet.' }}</p>
        </div>
      </div>
      <ng-template #loading><p>Loading results...</p></ng-template>
    </div>
  `,
  styles: [`
    // Test Results SCSS

// Variables
$primary-color: #4361ee;
$secondary-color: #3a0ca3;
$accent-color: #4cc9f0;
$danger-color: #f72585;
$success-color: #2ec4b6;
$info-color: #4895ef;
$text-primary: #2b2d42;
$text-secondary: #6c757d;
$light-bg: #f8f9fa;
$card-bg: #ffffff;
$border-color: #dee2e6;
$box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
$border-radius: 10px;

// Page Layout
.container {
  max-width: 1000px;
  padding: 0 20px;
}

// Header
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

// Results Card
.card {
  border: none;
  border-radius: $border-radius;
  box-shadow: $box-shadow;
  background-color: $card-bg;
  margin-bottom: 2rem;
  overflow: hidden;
  animation: fadeIn 0.5s ease;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 5px;
    background: linear-gradient(to bottom, $primary-color, $accent-color);
  }
  
  .card-body {
    padding: 2rem;
  }
  
  .card-title {
    font-size: 1.8rem;
    font-weight: 600;
    color: $secondary-color;
    margin-bottom: 1.2rem;
  }
  
  .card-text {
    color: $text-secondary;
    font-size: 1.1rem;
    margin-bottom: 0.8rem;
    
    &:nth-child(3) {
      font-size: 1.3rem;
      font-weight: 600;
      color: $primary-color;
      margin-bottom: 1.5rem;
    }
  }
}

// Section Headers
h5 {
  font-size: 1.25rem;
  font-weight: 600;
  color: $secondary-color;
  margin: 2rem 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid $border-color;
}

// Question List
ul {
  list-style-type: none;
  padding-left: 0;
  
  li {
    padding: 1rem;
    margin-bottom: 0.8rem;
    background-color: $light-bg;
    border-radius: $border-radius;
    color: $text-primary;
    
    &:nth-child(odd) {
      background-color: rgba($light-bg, 0.5);
    }
    
    span {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.95rem;
    }
  }
}

// Status Indicators
.text-success {
  color: $success-color !important;
  font-weight: 600;
}

.text-danger {
  color: $danger-color !important;
  font-weight: 600;
}

// Chart Containers
.chart-container {
  background-color: $light-bg;
  border-radius: $border-radius;
  padding: 1.5rem;
  margin: 1rem 0 1.5rem;
  height: 300px;
  position: relative;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba($accent-color, 0.02) 10px,
      rgba($accent-color, 0.02) 20px
    );
    border-radius: $border-radius;
    z-index: 0;
  }
  
  canvas {
    position: relative;
    z-index: 1;
  }
}

// Download Button
.btn-secondary {
  background-color: $primary-color;
  color: white;
  border-radius: 50px;
  padding: 0.6rem 1.8rem;
  font-weight: 500;
  margin-bottom: 1.2rem;
  border: none;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: darken($primary-color, 8%);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba($primary-color, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:focus {
    box-shadow: 0 0 0 0.25rem rgba($primary-color, 0.25);
  }
}

// Teacher Feedback Section
h5:last-of-type + p {
  background-color: $light-bg;
  padding: 1.5rem;
  border-radius: $border-radius;
  border-left: 4px solid $info-color;
  font-style: italic;
  color: $text-secondary;
}

// Loading Template
ng-template p {
  text-align: center;
  padding: 2rem;
  background-color: $light-bg;
  border-radius: $border-radius;
  color: $text-secondary;
  animation: pulse 1.5s infinite ease-in-out;
}

// Animations
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}

// Responsive Adjustments
@media (max-width: 768px) {
  .card {
    .card-body {
      padding: 1.5rem;
    }
    
    .card-title {
      font-size: 1.5rem;
    }
    
    .card-text {
      font-size: 1rem;
      
      &:nth-child(3) {
        font-size: 1.2rem;
      }
    }
  }
  
  h1 {
    font-size: 2rem;
  }
  
  h5 {
    font-size: 1.15rem;
  }
  
  .chart-container {
    height: 250px;
  }
  
  ul li {
    padding: 0.8rem;
    font-size: 0.95rem;
  }
}

// Print Styling for PDF
@media print {
  .btn-secondary {
    display: none;
  }
  
  .card {
    box-shadow: none;
    border: 1px solid $border-color;
    
    &:before {
      display: none;
    }
  }
  
  h1:after {
    display: none;
  }
  
  .chart-container {
    break-inside: avoid;
    page-break-inside: avoid;
    height: auto;
    min-height: 250px;
  }
}
  `]
})
export class StudentResultsComponent implements OnInit, AfterViewInit {
  result: any = {};
  feedback: string = ''; // Placeholder for future feedback endpoint
  classAverage: number = 0; // Placeholder for future backend data

  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  private pieChart!: Chart<'pie'>;
  private barChart!: Chart<'bar'>;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || !this.authService.isRole('Student')) {
      this.router.navigate(['/login']);
      return;
    }
    const testId = this.route.snapshot.params['id'];
    this.loadResult(testId);
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

  loadResult(testId: number): void {
    this.http.get<any>(`http://localhost:5000/api/student/results/${testId}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (result) => {
          this.result = result;
          this.classAverage = 75; // Mock data; replace with backend API call if available
          this.feedback = 'Good effort! Focus on reviewing incorrect answers.'; // Mock feedback
          this.setupCharts();
        },
        error: (err: HttpErrorResponse) => this.handleError(err, 'Error fetching results')
      });
  }

  setupCharts(): void {
    if (this.pieChartCanvas) {
      const correctCount = this.result.questions.filter((q: any) => q.isCorrect).length;
      const incorrectCount = this.result.questions.length - correctCount;
      this.pieChart = new Chart(this.pieChartCanvas.nativeElement, {
        type: 'pie',
        data: {
          labels: ['Correct', 'Incorrect'],
          datasets: [{ data: [correctCount, incorrectCount], backgroundColor: ['#28a745', '#dc3545'] }]
        },
        options: { responsive: true, plugins: { legend: { position: 'top' } } }
      });
    }
    if (this.barChartCanvas) {
      this.barChart = new Chart(this.barChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Your Score', 'Class Average'],
          datasets: [{
            label: 'Percentage (%)',
            data: [this.result.percentage, this.classAverage],
            backgroundColor: ['#007bff', '#ffc107']
          }]
        },
        options: {
          responsive: true,
          scales: { y: { title: { display: true, text: 'Percentage (%)' }, min: 0, max: 100 } }
        }
      });
    }
  }

  downloadPDF(): void {
    const doc = new jsPDF();
    doc.text(`Test Results: ${this.result.testTitle}`, 10, 10);
    doc.text(`Teacher: ${this.result.teacher}`, 10, 20);
    doc.text(`Score: ${this.result.score} / ${this.result.total} (${this.result.percentage.toFixed(2)}%)`, 10, 30);
    doc.text('Question Breakdown:', 10, 40);
    this.result.questions.forEach((q: any, i: number) => {
      doc.text(`${i + 1}. ${q.text}: ${q.isCorrect ? 'Correct' : 'Incorrect'}`, 10, 50 + i * 10);
    });
    doc.save(`result_${this.result.testId}.pdf`);
  }

  private handleError(err: HttpErrorResponse, message: string): void {
    console.error(`${message}:`, err);
    if (err.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
    } else if (err.status === 404) {
      alert('Result not found for this test.');
    }
  }
}