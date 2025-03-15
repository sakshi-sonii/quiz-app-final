import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import Chart from 'chart.js/auto';

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
        </div>
      </div>
      <ng-template #loading><p>Loading results...</p></ng-template>
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; }
    .card { box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .chart-container { position: relative; height: 300px; width: 100%; margin-bottom: 20px; }
    .text-success { color: #28a745; }
    .text-danger { color: #dc3545; }
  `]
})
export class StudentResultsComponent implements OnInit, AfterViewInit {
  result: any = {};

  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  private pieChart!: Chart<'pie'>;

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

  loadResult(testId: number): void {
    this.http.get<any>(`http://localhost:5000/api/student/results/${testId}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (result) => {
          console.log('Result Data:', result); // Debug
          this.result = result;
          this.setupChart();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error fetching results:', err);
          if (err.status === 401) {
            this.authService.logout();
            this.router.navigate(['/login']);
          } else if (err.status === 404) {
            alert('Result not found for this test.');
          }
        }
      });
  }

  setupChart(): void {
    if (this.pieChartCanvas) {
      const correctCount = this.result.questions.filter((q: any) => q.isCorrect).length;
      const incorrectCount = this.result.questions.length - correctCount;
      this.pieChart = new Chart(this.pieChartCanvas.nativeElement, {
        type: 'pie',
        data: {
          labels: ['Correct', 'Incorrect'],
          datasets: [{
            data: [correctCount, incorrectCount],
            backgroundColor: ['#28a745', '#dc3545']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' }
          }
        }
      });
    }
  }
}