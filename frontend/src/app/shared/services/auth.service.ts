import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private token = localStorage.getItem('token');

  constructor(private http: HttpClient, private router: Router) {}

  login(cedula: string, password: string) {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, { cedula, password });
  }

  saveToken(t: string) { this.token = t; localStorage.setItem('token', t); }
  getToken() { return this.token; }
  logout() { this.token = null; localStorage.removeItem('token'); this.router.navigate(['/login']); }
  isAuthenticated() { return !!this.token; }

  private _payload(): any {
    if (!this.token) return {};
    try { return JSON.parse(atob(this.token.split('.')[1])); } catch { return {}; }
  }

  getRole(): string  { return this._payload().role   || ''; }
  getNombre(): string { return this._payload().nombre || 'Usuario'; }
  getCedulaMasked(): string { return this._payload().cedula_masked || ''; }
}
