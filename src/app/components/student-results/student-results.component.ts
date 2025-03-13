import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-student-results',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-5">
      <h2>Test Results</h2>
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Score: {{ result.score }} / {{ result.total }}</h5>
          <p class="card-text">Percentage: {{ (result.score / result.total * 100).toFixed(2) }}%</p>
          <h5>Performance Analysis</h5>
          <ul>
            <li *ngFor="let q of result.questions; let i = index">
              Question {{ i + 1 }}: 
              <span [ngClass]="{'text-success': q.isCorrect, 'text-danger': !q.isCorrect}">
                {{ q.isCorrect ? 'Correct' : 'Incorrect' }}
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `
})
export class StudentResultsComponent implements OnInit {
  result: any = {};

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const resultId = this.route.snapshot.params['id'];
    this.http.get<any>(`http://localhost:5000/api/results/${resultId}`).subscribe(result => {
      this.result = result;
    });
  }
}