import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Adjust path as needed

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <h2>Available Tests</h2>
      <div class="row">
        <div class="col-md-4" *ngFor="let test of tests">
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">{{ test.title }}</h5>
              <p class="card-text">Duration: {{ test.duration }} minutes</p>
              <button class="btn btn-primary" (click)="startTest(test.id)">Start Test</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StudentDashboardComponent implements OnInit {
  tests: any[] = [];

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
    this.loadTests(); // Call a separate method for better structure
  }

  // Helper method to get headers with token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  loadTests(): void {
    this.http.get<any[]>('http://localhost:5000/api/tests', { headers: this.getAuthHeaders() })
      .subscribe({
        next: (tests) => {
          this.tests = tests;
          console.log('Tests loaded:', tests); // Optional: for debugging
        },
        error: (err) => {
          console.error('Error loading tests:', err);
          if (err.status === 401) {
            this.router.navigate(['/login']); // Redirect on unauthorized
          }
        }
      });
  }

  startTest(testId: number): void {
    this.router.navigate(['/test', testId]);
  }
}