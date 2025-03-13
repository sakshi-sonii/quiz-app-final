import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: any): boolean {
    const expectedRole = route.data['role'];
    if (!this.authService.getCurrentUser()) {
      this.router.navigate(['/login']);
      return false;
    }
    if (expectedRole && !this.authService.isRole(expectedRole)) {
      this.router.navigate(['/unauthorized']);
      return false;
    }
    return true;
  }
}