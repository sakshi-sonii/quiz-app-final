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
  `,
  styles: [`// Modern Login Form Styles

    // Variables
    $primary-color: #6e8efb;
    $secondary-color: #a777e3;
    $text-primary: #333;
    $text-secondary: #555;
    $border-color: #e1e1e1;
    $white: #fff;
    $light-bg: #f8f9fa;
    
    // Background gradient
    body {
      background: linear-gradient(135deg, $primary-color, $secondary-color);
      min-height: 100vh;
      display: flex;
      align-items: center;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    // Card styling
    .card {
      border: none;
      border-radius: 15px;
      box-shadow: 0 15px 25px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(5px);
      background-color: rgba($white, 0.95);
      transition: transform 0.3s ease;
      
      &:hover {
        transform: translateY(-5px);
      }
      
      .card-body {
        padding: 40px;
      }
      
      .card-title {
        color: $text-primary;
        font-weight: 700;
        margin-bottom: 30px;
        position: relative;
        
        &:after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          width: 50px;
          height: 3px;
          background: linear-gradient(to right, $primary-color, $secondary-color);
          transform: translateX(-50%);
        }
      }
    }
    
    // Form elements
    .form-label {
      font-weight: 600;
      color: $text-secondary;
      font-size: 0.9rem;
    }
    
    .form-control {
      border-radius: 8px;
      padding: 12px 15px;
      border: 1px solid $border-color;
      transition: all 0.3s ease;
      
      &:focus {
        box-shadow: 0 0 0 3px rgba($primary-color, 0.2);
        border-color: $primary-color;
        outline: none;
      }
      
      &::placeholder {
        color: lighten($text-secondary, 30%);
        font-size: 0.9rem;
      }
    }
    
    // Button styling
    .btn-primary {
      background: linear-gradient(to right, $primary-color, $secondary-color);
      border: none;
      border-radius: 8px;
      padding: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-top: 15px;
      transition: all 0.3s ease;
      
      &:hover {
        background: linear-gradient(to right, darken($primary-color, 5%), darken($secondary-color, 5%));
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba($primary-color, 0.3);
      }
      
      &:focus, &:active {
        box-shadow: 0 0 0 3px rgba($primary-color, 0.3);
        outline: none;
      }
    }
    
    // Optional: Additional elements for enhanced UI
    .login-extra {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
      font-size: 0.85rem;
      
      a {
        color: $primary-color;
        text-decoration: none;
        transition: color 0.3s;
        
        &:hover {
          color: $secondary-color;
          text-decoration: underline;
        }
      }
    }
    
    .form-check-input {
      &:checked {
        background-color: $primary-color;
        border-color: $primary-color;
      }
      
      &:focus {
        box-shadow: 0 0 0 2px rgba($primary-color, 0.25);
        border-color: $primary-color;
      }
    }
    
    // Responsive adjustments
    @media (max-width: 768px) {
      .card .card-body {
        padding: 25px;
      }
    }
    
    // Animation for form submission feedback
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba($primary-color, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba($primary-color, 0); }
      100% { box-shadow: 0 0 0 0 rgba($primary-color, 0); }
    }
    
    .btn-primary.submitting {
      animation: pulse 1.5s infinite;
    }`]
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