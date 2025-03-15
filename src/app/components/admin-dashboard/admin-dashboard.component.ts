import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service'; // Adjust path as needed
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  teachers: any[] = [];
  filteredTeachers: any[] = [];
  newTeacher = { username: '', password: '' };
  analytics: any = {
    averageScore: 0,
    totalTeachers: 0,
    totalStudents: 0,
    activeTeachers: 0,
    scoreDistribution: [],
    teacherActivity: [],
    categoryPerformance: []
  };
  teacherSearch: string = '';
  selectedTeachers: number[] = [];
  selectedTeacherId: number | null = null;

  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef<HTMLCanvasElement>;

  private barChart!: Chart<'bar'>;
  private lineChart!: Chart<'bar'>; // Changed to bar chart
  private pieChart!: Chart<'pie'>;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn() || !this.authService.isRole('Admin')) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadTeachers();
    this.loadAnalytics();
  }

  ngAfterViewInit(): void {
    // Charts initialized after analytics data is loaded
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (!token) {
      this.authService.logout();
      this.router.navigate(['/login']);
      return new HttpHeaders();
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  loadTeachers(): void {
    const headers = this.getAuthHeaders();
    this.http.get<any[]>('http://localhost:5000/api/admin/teachers', { headers }).subscribe({
      next: (teachers) => {
        this.teachers = teachers.map(t => ({ ...t, selected: false }));
        this.filteredTeachers = [...this.teachers];
      },
      error: (err: HttpErrorResponse) => this.handleError(err, 'Error loading teachers')
    });
  }

  loadAnalytics(): void {
    const headers = this.getAuthHeaders();
    this.http.get<any>('http://localhost:5000/api/admin/analytics', { headers }).subscribe({
      next: (analytics) => {
        this.analytics = analytics;
        this.setupCharts();
      },
      error: (err: HttpErrorResponse) => this.handleError(err, 'Error loading analytics')
    });
  }

  setupCharts(): void {
    // Bar Chart: Score Distribution (Percentage-based)
    if (this.barChartCanvas) {
      this.barChart = new Chart(this.barChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
          datasets: [{
            label: 'Students',
            data: this.analytics.scoreDistribution,
            backgroundColor: '#007bff'
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: { title: { display: true, text: 'Score Range (%)' } },
            y: { title: { display: true, text: 'Number of Students' } }
          }
        }
      });
    }

    // Bar Chart: Teacher Activity (Tests per Teacher)
    if (this.lineChartCanvas) {
      this.lineChart = new Chart(this.lineChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: this.teachers.map(t => t.username),
          datasets: [{
            label: 'Tests Created',
            data: this.analytics.teacherActivity,
            backgroundColor: '#28a745'
          }]
        },
        options: {
          responsive: true,
          scales: {
            x: { title: { display: true, text: 'Teachers' } },
            y: { title: { display: true, text: 'Test Count' } }
          }
        }
      });
    }

    // Pie Chart: Performance by Category
    if (this.pieChartCanvas) {
      this.pieChart = new Chart(this.pieChartCanvas.nativeElement, {
        type: 'pie',
        data: {
          labels: this.analytics.categoryPerformance.map((c: any) => c.category),
          datasets: [{
            data: this.analytics.categoryPerformance.map((c: any) => c.score),
            backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            tooltip: {
              callbacks: {
                label: (context) => `${context.label}: ${context.raw}%`
              }
            }
          }
        }
      });
    }
  }

  addTeacher(): void {
    const headers = this.getAuthHeaders();
    this.http.post('http://localhost:5000/api/admin/teachers', this.newTeacher, { headers }).subscribe({
      next: () => {
        this.showSuccess('Teacher added successfully');
        this.loadTeachers();
        this.loadAnalytics();
        this.newTeacher = { username: '', password: '' };
      },
      error: (err: HttpErrorResponse) => this.handleError(err, 'Add teacher failed')
    });
  }

  deleteTeacher(teacherId: number): void {
    if (confirm('Are you sure you want to delete this teacher?')) {
      const headers = this.getAuthHeaders();
      this.http.delete(`http://localhost:5000/api/admin/teachers/${teacherId}`, { headers }).subscribe({
        next: () => {
          this.showSuccess('Teacher deleted successfully');
          this.loadTeachers();
          this.loadAnalytics();
          this.selectedTeacherId = null;
        },
        error: (err: HttpErrorResponse) => this.handleError(err, 'Delete teacher failed')
      });
    }
  }

  toggleTeacherStatus(teacherId: number, currentStatus: boolean): void {
    const headers = this.getAuthHeaders();
    this.http.put(`http://localhost:5000/api/admin/teachers/${teacherId}/status`, 
      { active: !currentStatus }, 
      { headers }
    ).subscribe({
      next: () => {
        this.showSuccess(`Teacher ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        this.loadTeachers();
        this.loadAnalytics();
      },
      error: (err: HttpErrorResponse) => this.handleError(err, 'Toggle status failed')
    });
  }

  bulkToggleStatus(activate: boolean): void {
    if (this.selectedTeachers.length === 0) return;
    const headers = this.getAuthHeaders();
    this.http.put('http://localhost:5000/api/admin/teachers/bulk-status', 
      { teacherIds: this.selectedTeachers, active: activate }, 
      { headers }
    ).subscribe({
      next: () => {
        this.showSuccess(`Selected teachers ${activate ? 'activated' : 'deactivated'} successfully`);
        this.loadTeachers();
        this.loadAnalytics();
        this.selectedTeachers = [];
      },
      error: (err: HttpErrorResponse) => this.handleError(err, 'Bulk toggle status failed')
    });
  }

  filterTeachers(): void {
    this.filteredTeachers = this.teachers.filter(teacher =>
      teacher.username.toLowerCase().includes(this.teacherSearch.toLowerCase())
    );
  }

  updateSelectedTeachers(): void {
    this.selectedTeachers = this.teachers
      .filter(teacher => teacher.selected)
      .map(teacher => teacher.id);
  }

  toggleTeacherDetails(teacherId: number): void {
    this.selectedTeacherId = this.selectedTeacherId === teacherId ? null : teacherId;
  }

  exportTeachers(): void {
    const csvData = this.convertToCSV(this.filteredTeachers);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teachers_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private convertToCSV(teachers: any[]): string {
    const headers = ['Username', 'Status', 'Email', 'Last Login', 'Tests Assigned'];
    const rows = teachers.map(t => [
      t.username,
      t.active ? 'Active' : 'Inactive',
      t.email || 'N/A',
      t.lastLogin ? new Date(t.lastLogin).toLocaleString() : 'Never',
      t.testsAssigned || 0
    ]);
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private handleError(err: HttpErrorResponse, message: string): void {
    console.error(`${message}:`, err);
    if (err.status === 401) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  private showSuccess(message: string): void {
    alert(message); // Replace with a toast notification library in production
  }
}