import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; // Adjust path

@Component({
  selector: 'app-test-attempt',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-5">
      <div *ngIf="loading">Loading test...</div>
      <div *ngIf="!loading && questions.length === 0">Test not found or unauthorized.</div>
      <div *ngIf="!loading && questions.length > 0" class="row">
        <div class="col-md-8">
          <h3>Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}</h3>
          <p>{{ questions[currentQuestionIndex].text }}</p>
          <div *ngFor="let option of questions[currentQuestionIndex].options; let i = index" class="form-check">
            <input type="radio" class="form-check-input" [id]="'option' + i" [name]="'question' + currentQuestionIndex" 
                   [(ngModel)]="responses[currentQuestionIndex]" [value]="i">
            <label class="form-check-label" [for]="'option' + i">{{ option }}</label>
          </div>
          <div class="mt-3">
            <button class="btn btn-secondary me-2" (click)="previousQuestion()" [disabled]="currentQuestionIndex === 0">Previous</button>
            <button class="btn btn-secondary me-2" (click)="nextQuestion()" [disabled]="currentQuestionIndex === questions.length - 1">Next</button>
            <button class="btn btn-warning me-2" (click)="markForReview()">Mark for Review</button>
            <button class="btn btn-danger" (click)="clearResponse()">Clear Response</button>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body">
              <h5>Time Remaining: {{ timeRemaining | date:'mm:ss' }}</h5>
              <h5>Questions</h5>
              <div class="d-flex flex-wrap">
                <button *ngFor="let q of questions; let i = index" class="btn m-1"
                        [ngClass]="{'btn-primary': i === currentQuestionIndex, 'btn-warning': review[i], 'btn-success': responses[i] !== undefined}"
                        (click)="goToQuestion(i)">{{ i + 1 }}</button>
              </div>
              <button class="btn btn-success mt-3 w-100" (click)="submitTest()">Submit Test</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles:`
  /* Extending the previous design with specific test-taking styles */
body {
    background-color: #f4f7f6;
    font-family: 'Inter', sans-serif;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    background-color: #ffffff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
}

/* Loading and Error States */
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    font-size: 1.5rem;
    color: #3498db;
}

.error-message {
    background-color: #f8d7da;
    color: #721c24;
    padding: 1rem;
    border-radius: 8px;
    text-align: center;
    margin-top: 2rem;
}

/* Question Styling */
h3 {
    color: #2c3e50;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.5rem;
}

.form-check {
    margin-bottom: 1rem;
    background-color: #f8f9fa;
    padding: 0.75rem;
    border-radius: 6px;
    transition: background-color 0.3s ease;
}

.form-check:hover {
    background-color: #e9ecef;
}

.form-check-input {
    margin-right: 1rem;
}

.form-check-label {
    color: #2c3e50;
    font-weight: 500;
}

.form-check-input:checked + .form-check-label {
    color: #3498db;
    font-weight: 600;
}

/* Question Navigation Card */
.question-navigation-card {
    position: sticky;
    top: 2rem;
}

.question-nav-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.question-nav-buttons .btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

/* Button Styles */
.btn-navigation {
    background-color: #ecf0f1;
    color: #2c3e50;
    border: none;
    transition: all 0.3s ease;
}

.btn-navigation:hover {
    background-color: #3498db;
    color: white;
}

.btn-current {
    background-color: #3498db;
    color: white;
}

.btn-answered {
    background-color: #2ecc71;
    color: white;
}

.btn-review {
    background-color: #f39c12;
    color: white;
}

/* Time Remaining */
.time-remaining {
    color: #e74c3c;
    font-weight: bold;
    text-align: center;
    margin-bottom: 1rem;
    font-size: 1.25rem;
}

/* Submit Button */
.btn-submit {
    background-color: #2ecc71;
    border-color: #2ecc71;
    color: white;
    font-weight: 600;
    transition: all 0.3s ease;
}

.btn-submit:hover {
    background-color: #27ae60;
    border-color: #27ae60;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
    .container {
        padding: 1rem;
    }
    
    .question-nav-buttons {
        justify-content: center;
    }
    
    .question-navigation-card {
        position: static;
        margin-top: 1rem;
    }
}

/* Print Styles */
@media print {
    body {
        background-color: white;
    }
    
    .container {
        box-shadow: none;
    }
}`
})
export class TestAttemptComponent implements OnInit, OnDestroy {
  testId!: number;
  questions: any[] = [];
  currentQuestionIndex = 0;
  responses: any[] = [];
  review: boolean[] = [];
  timeRemaining!: number; // Time in seconds
  private timerSubscription!: Subscription;
  loading: boolean = true; // Add loading state

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService // Inject AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.testId = this.route.snapshot.params['id'];
    this.loadTest();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadTest(): void {
    this.loading = true;
    this.http.get<any>(`http://localhost:5000/api/tests/${this.testId}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (test) => {
          this.questions = test.questions || []; // Ensure questions is an array
          this.responses = new Array(this.questions.length);
          this.review = new Array(this.questions.length).fill(false);
          this.timeRemaining = test.duration * 60; // Convert minutes to seconds
          this.startTimer();
          this.loading = false;
          console.log('Test loaded:', test);
        },
        error: (err) => {
          console.error('Error loading test:', err);
          this.loading = false;
          if (err.status === 401) {
            this.router.navigate(['/login']);
          }
        }
      });
  }

  startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
      } else {
        this.submitTest(); // Auto-submit when time is up
      }
    });
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    }
  }

  goToQuestion(index: number): void {
    this.currentQuestionIndex = index;
  }

  markForReview(): void {
    this.review[this.currentQuestionIndex] = true;
  }

  clearResponse(): void {
    this.responses[this.currentQuestionIndex] = undefined;
  }

  submitTest(): void {
    this.timerSubscription.unsubscribe();
    const submission = {
      testId: this.testId,
      responses: this.responses
    };
    this.http.post<any>('http://localhost:5000/api/tests/submit', submission, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (result) => {
          this.router.navigate(['/student/results', result.id]);
        },
        error: (err) => {
          console.error('Error submitting test:', err);
          if (err.status === 401) {
            this.router.navigate(['/login']);
          }
        }
      });
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
}