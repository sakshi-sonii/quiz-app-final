import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h3 class="card-title text-center">Login</h3>
              <form (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input type="text" class="form-control" id="username" [(ngModel)]="credentials.username" name="username" required>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <input type="password" class="form-control" id="password" [(ngModel)]="credentials.password" name="password" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Login</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  credentials = { username: '', password: '' };

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        const user = response.user;
        console.log('User object:', user);
        if (user.role === 'Admin') {
          console.log('Navigating to /admin');
          this.router.navigate(['/admin']).then(success => {
            console.log('Navigation success:', success); // true or false
          });
        } else if (user.role === 'Teacher') {
          console.log('Navigating to /teacher');
          this.router.navigate(['/teacher']).then(success => {
            console.log('Navigation success:', success);
          });
        } else if (user.role === 'Student') {
          console.log('Navigating to /student');
          this.router.navigate(['/student']).then(success => {
            console.log('Navigation success:', success);
          });
        } else {
          console.log('Unknown role:', user.role);
        }
      },
      error: (err) => console.error('Login failed', err)
    });
  }
}