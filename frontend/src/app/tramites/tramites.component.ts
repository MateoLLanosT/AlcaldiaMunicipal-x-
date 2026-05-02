import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { environment } from '../../environments/environment';
import { AuthService } from '../shared/services/auth.service';
import DOMPurify from 'dompurify';

@Component({
  selector: 'app-tramites',
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; }

    .navbar {
      background: #1a4f8a; color: #fff;
      padding: 0 32px; height: 60px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 2px 6px rgba(0,0,0,.25);
    }
    .navbar-brand { font-size: 18px; font-weight: 700; letter-spacing: .5px; }
    .navbar-brand span { color: #f0c040; }
    .navbar-user { display: flex; align-items: center; gap: 12px; font-size: 14px; }
    .badge-role {
      background: rgba(255,255,255,.2); border-radius: 12px;
      padding: 3px 10px; font-size: 12px; font-weight: 600;
    }
    .btn-logout {
      background: transparent; border: 1px solid rgba(255,255,255,.5);
      color: #fff; padding: 5px 14px; border-radius: 4px; cursor: pointer; font-size: 13px;
    }
    .btn-logout:hover { background: rgba(255,255,255,.15); }

    .container { max-width: 960px; margin: 32px auto; padding: 0 16px; }

    .section { background: #fff; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.1); margin-bottom: 24px; overflow: hidden; }
    .section-header { background: #f5f7fa; padding: 14px 20px; border-bottom: 1px solid #e0e4ea; }
    .section-header h2 { font-size: 15px; font-weight: 600; color: #1a4f8a; }
    .section-body { padding: 20px; }

    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th { text-align: left; padding: 10px 12px; background: #f5f7fa; color: #555; font-weight: 600; border-bottom: 2px solid #e0e4ea; }
    td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; color: #333; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafbff; }

    .empty-msg { text-align: center; color: #999; padding: 32px 0; font-size: 14px; }

    .badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .badge-pendiente   { background: #fff3cd; color: #856404; }
    .badge-aprobado    { background: #d1e7dd; color: #155724; }
    .badge-en_revision { background: #cce5ff; color: #004085; }
    .badge-rechazado   { background: #f8d7da; color: #721c24; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 5px; }
    .form-group label { font-size: 13px; font-weight: 600; color: #444; }
    .form-group input {
      padding: 9px 12px; border: 1px solid #cdd3da; border-radius: 5px;
      font-size: 14px; outline: none; transition: border .2s;
    }
    .form-group input:focus { border-color: #1a4f8a; box-shadow: 0 0 0 2px rgba(26,79,138,.1); }
    .form-group input.invalid { border-color: #dc3545; }
    .error-text { color: #dc3545; font-size: 12px; }
    .full-col { grid-column: 1 / -1; }

    .card-preview {
      background: linear-gradient(135deg, #1a4f8a, #2d7dd2);
      border-radius: 10px; padding: 20px 24px; color: #fff;
      font-family: monospace; margin-bottom: 20px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .card-number { font-size: 20px; letter-spacing: 4px; }
    .card-meta { display: flex; justify-content: space-between; font-size: 13px; opacity: .8; }
    .token-info { font-size: 11px; opacity: .6; margin-top: 4px; }

    .btn-primary {
      background: #1a4f8a; color: #fff; border: none;
      padding: 11px 28px; border-radius: 5px; font-size: 15px;
      cursor: pointer; font-weight: 600; transition: background .2s;
    }
    .btn-primary:hover { background: #16437a; }
    .btn-primary:disabled { background: #9db5d0; cursor: not-allowed; }

    .alert { padding: 12px 16px; border-radius: 5px; font-size: 14px; margin-top: 12px; }
    .alert-success { background: #d1e7dd; color: #155724; border: 1px solid #badbcc; }
    .alert-error   { background: #f8d7da; color: #721c24; border: 1px solid #f5c2c7; }

    .search-row { display: flex; gap: 10px; align-items: flex-end; }
    .search-row input { flex: 1; padding: 9px 12px; border: 1px solid #cdd3da; border-radius: 5px; font-size: 14px; outline: none; }
    .search-row input:focus { border-color: #1a4f8a; }
    .btn-secondary {
      background: #6c757d; color: #fff; border: none;
      padding: 9px 20px; border-radius: 5px; cursor: pointer; font-size: 14px;
    }
    .btn-secondary:hover { background: #5a6268; }

    .intranet-banner {
      background: #fff8e1; border-left: 4px solid #f0c040;
      padding: 10px 14px; border-radius: 0 5px 5px 0;
      font-size: 13px; color: #7a6000; margin-bottom: 16px;
    }

    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .navbar-brand { font-size: 14px; }
    }
  `],
  template: `
    <!-- NAVBAR -->
    <div class="navbar">
      <div class="navbar-brand">🏛 Alcaldía <span>Digital</span></div>
      <div class="navbar-user">
        <span>{{ nombreUsuario }}</span>
        <span class="badge-role">{{ rolLabel }}</span>
        <button class="btn-logout" (click)="logout()">Cerrar sesión</button>
      </div>
    </div>

    <div class="container">

      <!-- NOTICIAS -->
      <div *ngIf="noticiaHtml" class="section">
        <div class="section-header"><h2>📢 Noticias</h2></div>
        <div class="section-body" [innerHTML]="noticiaHtml"></div>
      </div>

      <!-- MIS TRÁMITES -->
      <div class="section">
        <div class="section-header"><h2>📋 Mis Trámites</h2></div>
        <div class="section-body">
          <div *ngIf="tramites.length === 0" class="empty-msg">No tienes trámites registrados.</div>
          <table *ngIf="tramites.length > 0">
            <thead>
              <tr>
                <th>#</th>
                <th>Tipo de trámite</th>
                <th>Estado</th>
                <th>Descripción</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of tramites">
                <td>{{ t[0] }}</td>
                <td>{{ t[1] }}</td>
                <td><span class="badge" [ngClass]="'badge-' + t[2]">{{ t[2] }}</span></td>
                <td>{{ t[3] }}</td>
                <td>{{ t[4] | date:'dd/MM/yyyy' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- INTRANET: BUSCAR FUNCIONARIOS -->
      <div *ngIf="canSearchFuncionarios" class="section">
        <div class="section-header"><h2>🔍 Intranet — Directorio de Funcionarios</h2></div>
        <div class="section-body">
          <div class="intranet-banner">
            Acceso restringido a <strong>ROLE_FUNCIONARIO</strong> y <strong>ROLE_ADMIN</strong>
          </div>
          <div class="search-row">
            <input [(ngModel)]="busqueda" placeholder="Buscar por nombre..." (keyup.enter)="buscarFuncionario()" />
            <button class="btn-secondary" type="button" (click)="buscarFuncionario()">Buscar</button>
          </div>
          <div *ngIf="funcionarios.length > 0" style="margin-top:16px">
            <table>
              <thead><tr><th>#</th><th>Nombre</th><th>Cargo</th><th>Email</th></tr></thead>
              <tbody>
                <tr *ngFor="let f of funcionarios">
                  <td>{{ f[0] }}</td>
                  <td>{{ f[1] }}</td>
                  <td>{{ f[2] }}</td>
                  <td>{{ f[3] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div *ngIf="busquedaRealizada && funcionarios.length === 0" class="empty-msg" style="padding:16px 0">
            No se encontraron funcionarios.
          </div>
        </div>
      </div>

      <!-- PAGO DE IMPUESTO -->
      <div class="section">
        <div class="section-header"><h2>💳 Pago de Impuesto Predial</h2></div>
        <div class="section-body">

          <!-- Preview de tarjeta -->
          <div class="card-preview">
            <div class="card-number">{{ cardPreview }}</div>
            <div class="card-meta">
              <span>{{ nombreUsuario }}</span>
              <span>CVV: •••</span>
            </div>
            <div class="token-info" *ngIf="paymentTokenPreview">
              Token enviado al servidor: {{ paymentTokenPreview }}
            </div>
          </div>

          <form [formGroup]="pagoForm" (ngSubmit)="procesarPago()">
            <div class="form-grid">
              <div class="form-group full-col">
                <label>Número de tarjeta</label>
                <input formControlName="tarjeta" type="text" maxlength="16"
                       placeholder="1234 5678 9012 3456"
                       [class.invalid]="touched('tarjeta')"
                       (input)="updateCardPreview()" />
                <span class="error-text" *ngIf="touched('tarjeta')">Debe tener 16 dígitos</span>
              </div>
              <div class="form-group">
                <label>CVV</label>
                <input formControlName="cvv" type="password" maxlength="4" placeholder="•••"
                       [class.invalid]="touched('cvv')" />
                <span class="error-text" *ngIf="touched('cvv')">3 o 4 dígitos</span>
              </div>
              <div class="form-group">
                <label>Monto ($)</label>
                <input formControlName="monto" type="number" placeholder="150000"
                       [class.invalid]="touched('monto')" />
                <span class="error-text" *ngIf="touched('monto')">Ingresa un monto válido</span>
              </div>
              <div class="form-group full-col">
                <label>Matrícula inmobiliaria</label>
                <input formControlName="matricula" type="text" placeholder="MAT-2024-001"
                       [class.invalid]="touched('matricula')" />
                <span class="error-text" *ngIf="touched('matricula')">Campo requerido</span>
              </div>
            </div>

            <div style="margin-top:20px; display:flex; align-items:center; gap:16px">
              <button class="btn-primary" type="submit" [disabled]="pagoLoading">
                {{ pagoLoading ? 'Procesando...' : 'Pagar Impuesto' }}
              </button>
              <span style="font-size:12px;color:#888">
                🔒 El número de tarjeta nunca se envía al servidor
              </span>
            </div>

            <div *ngIf="pagoMsg" class="alert" [ngClass]="pagoOk ? 'alert-success' : 'alert-error'">
              {{ pagoMsg }}
            </div>
          </form>

        </div>
      </div>

    </div>
  `
})
export class TramitesComponent implements OnInit {
  tramites: any[]      = [];
  funcionarios: any[]  = [];
  busqueda             = '';
  busquedaRealizada    = false;
  noticiaHtml: SafeHtml = '';
  pagoForm!: FormGroup;
  pagoLoading          = false;
  pagoMsg              = '';
  pagoOk               = false;
  cardPreview          = '•••• •••• •••• ••••';
  paymentTokenPreview  = '';

  get nombreUsuario() { return this.auth.getNombre(); }
  get rolLabel() {
    const map: Record<string,string> = {
      ROLE_CIUDADANO: 'Ciudadano',
      ROLE_FUNCIONARIO: 'Funcionario',
      ROLE_ADMIN: 'Administrador'
    };
    return map[this.auth.getRole()] ?? this.auth.getRole();
  }
  get canSearchFuncionarios() {
    return ['ROLE_FUNCIONARIO','ROLE_ADMIN'].includes(this.auth.getRole());
  }

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private fb: FormBuilder,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.pagoForm = this.fb.group({
      tarjeta:  ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      cvv:      ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      monto:    [null, [Validators.required, Validators.min(0.01)]],
      matricula:['', [Validators.required, Validators.maxLength(50)]]
    });

    this.http.get<any>(`${environment.apiUrl}/tramites/mis-tramites`).subscribe({
      next: r  => this.tramites = r.tramites ?? [],
      error: () => {}
    });

    this.http.get<any>(`${environment.apiUrl}/noticias/ultima`).subscribe({
      next: r => {
        const clean = DOMPurify.sanitize(r?.contenido_html ?? '', {
          ALLOWED_TAGS: ['p','strong','em','ul','ol','li','h1','h2','h3','br'],
          ALLOWED_ATTR: []
        });
        this.noticiaHtml = this.sanitizer.bypassSecurityTrustHtml(clean);
      },
      error: () => {}
    });
  }

  touched(field: string): boolean {
    const c = this.pagoForm.get(field);
    return !!(c && c.invalid && c.touched);
  }

  updateCardPreview(): void {
    const v = this.pagoForm.value.tarjeta ?? '';
    const padded = v.padEnd(16, '•');
    this.cardPreview = `${padded.slice(0,4)} ${padded.slice(4,8)} ${padded.slice(8,12)} ${padded.slice(12,16)}`;
  }

  buscarFuncionario(): void {
    this.busquedaRealizada = true;
    const q = encodeURIComponent(this.busqueda.trim());
    this.http.get<any>(`${environment.apiUrl}/intranet/funcionarios?buscar=${q}`).subscribe({
      next: r  => this.funcionarios = r.funcionarios ?? [],
      error: () => { this.funcionarios = []; }
    });
  }

  procesarPago(): void {
    this.pagoForm.markAllAsTouched();
    if (this.pagoForm.invalid) return;

    const tarjeta = String(this.pagoForm.value.tarjeta);
    const token   = `tok_${tarjeta.slice(-4)}_${Date.now()}`;
    this.paymentTokenPreview = token;
    this.pagoLoading = true;
    this.pagoMsg     = '';

    this.http.post<any>(`${environment.apiUrl}/pago/impuesto`, {
      payment_token:          token,
      matricula_inmobiliaria: String(this.pagoForm.value.matricula),
      monto:                  Number(this.pagoForm.value.monto)
    }).subscribe({
      next: r => {
        this.pagoLoading = false;
        this.pagoOk      = true;
        this.pagoMsg     = `✅ Pago aprobado — Matrícula: ${r.matricula} | Monto: $${r.monto}`;
        this.pagoForm.reset();
        this.cardPreview = '•••• •••• •••• ••••';
      },
      error: () => {
        this.pagoLoading = false;
        this.pagoOk      = false;
        this.pagoMsg     = '❌ Error al procesar el pago. Intenta de nuevo.';
      }
    });
  }

  logout(): void { this.auth.logout(); }
}
