import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router'; // Add ActivatedRouteSnapshot
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean { // Type route properly
    const expectedRole = route.data['role'];
    const currentUser = this.authService.getCurrentUser();
    console.log('Guard: Current user:', currentUser, 'Expected role:', expectedRole); // Debug
    if (!currentUser) {
      console.log('Guard: No user, redirecting to /login');
      this.router.navigate(['/login']);
      return false;
    }
    if (expectedRole && !this.authService.isRole(expectedRole)) {
      console.log('Guard: Role mismatch, redirecting to /unauthorized');
      this.router.navigate(['/unauthorized']);
      return false;
    }
    console.log('Guard: Access granted');
    return true;
  }
}