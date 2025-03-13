import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-attempt',
  standalone: true,
  imports: [CommonModule,FormsModule],
  template: `
    <div class="container mt-5">
      <div class="row">
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
  `
})
export class TestAttemptComponent implements OnInit, OnDestroy {
  testId!: number;
  questions: any[] = [];
  currentQuestionIndex = 0;
  responses: any[] = [];
  review: boolean[] = [];
  timeRemaining!: number; // Time in seconds
  private timerSubscription!: Subscription;

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.testId = this.route.snapshot.params['id'];
    this.loadTest();
  }

  loadTest(): void {
    this.http.get<any>(`http://localhost:5000/api/tests/${this.testId}`).subscribe(test => {
      this.questions = test.questions;
      this.responses = new Array(this.questions.length);
      this.review = new Array(this.questions.length).fill(false);
      this.timeRemaining = test.duration * 60; // Convert minutes to seconds
      this.startTimer();
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
    this.http.post<any>('http://localhost:5000/api/tests/submit', submission).subscribe(result => {
      this.router.navigate(['/student/results', result.id]);
    });
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }
}