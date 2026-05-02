import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../shared/services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div style="max-width:400px;margin:80px auto;padding:32px;border:1px solid #ddd;border-radius:8px;font-family:sans-serif">
      <h2 style="margin-bottom:24px">Alcaldía Digital — Ingreso</h2>

      <div *ngIf="errorMsg" style="background:#fee;color:#c00;padding:10px;border-radius:4px;margin-bottom:16px">
        {{ errorMsg }}
      </div>

      <form [formGroup]="form" (ngSubmit)="login()">
        <div style="margin-bottom:16px">
          <label>Cédula</label><br/>
          <input formControlName="cedula" type="text" placeholder="Ej: 1234567890"
                 style="width:100%;padding:8px;margin-top:4px;box-sizing:border-box" />
        </div>
        <div style="margin-bottom:24px">
          <label>Contraseña</label><br/>
          <input formControlName="password" type="password"
                 style="width:100%;padding:8px;margin-top:4px;box-sizing:border-box" />
        </div>
        <button type="submit" [disabled]="loading"
                style="width:100%;padding:10px;background:#1a6fb5;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px">
          {{ loading ? 'Ingresando...' : 'Ingresar' }}
        </button>
      </form>
    </div>
  `
})
export class LoginComponent {
  form: FormGroup;
  errorMsg = '';
  loading = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      cedula:   ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  login(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMsg = '';

    const { cedula, password } = this.form.value;
    this.auth.login(cedula, password).subscribe({
      next: (res: any) => {
        this.auth.saveToken(res.token);
        this.router.navigate(['/']);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMsg = err.status === 401
          ? 'Cédula o contraseña incorrectos.'
          : 'Error al conectar con el servidor.';
      }
    });
  }
}
