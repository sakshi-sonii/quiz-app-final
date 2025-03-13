import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

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

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.http.get<any[]>('http://localhost:5000/api/tests').subscribe(tests => {
      this.tests = tests;
    });
  }

  startTest(testId: number): void {
    this.router.navigate(['/test', testId]);
  }
}