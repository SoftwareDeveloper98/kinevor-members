import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MembersFacade } from './members.facade';

/** Staff member profile with masking, reveal, freeze and unfreeze actions. */
@Component({
  selector: 'kinevor-member-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    NgClass,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    @if (loading()) {
      <div class="table-loading" role="status">
        <mat-spinner diameter="52" />
        <span>Loading member…</span>
      </div>
    }

    @if (!loading() && member(); as member) {
      <div class="page-container">
        <div class="detail-hero">
          <a mat-icon-button routerLink="/members" aria-label="Back to member directory" class="flip-rtl">
            <mat-icon aria-hidden="true">arrow_back</mat-icon>
          </a>

          <span class="hero-avatar" aria-hidden="true">{{ initials(member.fullName) }}</span>

          <div class="hero-copy">
            <div class="hero-title-row">
              <h1>{{ member.fullName }}</h1>
              <span class="status-chip" [ngClass]="'status-' + member.status.toLowerCase()">
                {{ member.status }}
              </span>
            </div>
            <p class="hero-meta">
              <span>{{ member.memberNumber }}</span>
              <span aria-hidden="true">·</span>
              <span>Joined {{ member.joinedAt | date: 'mediumDate' }}</span>
              <span aria-hidden="true">·</span>
              <span>Age {{ member.age }}</span>
            </p>
          </div>

          <div class="hero-actions">
            @if (!member.revealed) {
              <button mat-stroked-button type="button" (click)="reveal()" [disabled]="actionLoading()">
                <mat-icon aria-hidden="true">visibility</mat-icon>
                Reveal sensitive data
              </button>
            } @else {
              <span class="revealed-chip"><mat-icon aria-hidden="true">lock_open</mat-icon> Sensitive data revealed</span>
            }

            @if (member.status === 'Frozen') {
              <button mat-flat-button color="primary" type="button" (click)="unfreeze()" [disabled]="actionLoading()">
                <mat-icon aria-hidden="true">play_circle</mat-icon>
                Unfreeze member
              </button>
            } @else if (member.status === 'Active') {
              <button mat-stroked-button type="button" (click)="showFreeze = !showFreeze">
                <mat-icon aria-hidden="true">ac_unit</mat-icon>
                Freeze membership
              </button>
            }
          </div>
        </div>

        @if (facade.error(); as error) {
          <p class="notice notice-error" role="alert"><mat-icon aria-hidden="true">error</mat-icon>{{ error }}</p>
        }

        @if (member.status === 'Frozen') {
          <div class="notice notice-info freeze-notice">
            <mat-icon aria-hidden="true">ac_unit</mat-icon>
            <div>
              <strong>Frozen until {{ member.frozenUntil | date: 'mediumDate' }}</strong>
              <p>Reason: {{ member.freezeReason }}</p>
            </div>
          </div>
        }

        @if (showFreeze && member.status === 'Active') {
          <mat-card class="gym-card freeze-card">
            <mat-card-content>
              <div class="freeze-head">
                <span class="kx-icon-badge" aria-hidden="true"><mat-icon>ac_unit</mat-icon></span>
                <div>
                  <h2>Freeze membership</h2>
                  <p>The member keeps their profile but cannot check in until the end date.</p>
                </div>
              </div>
              <div class="freeze-form">
                <mat-form-field appearance="outline">
                  <mat-label>Reason</mat-label>
                  <input matInput [(ngModel)]="freezeReason" placeholder="Travel, injury, medical leave…" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Frozen until</mat-label>
                  <input matInput type="date" [(ngModel)]="freezeUntil" />
                </mat-form-field>
                <button
                  mat-flat-button
                  color="primary"
                  type="button"
                  (click)="freeze()"
                  [disabled]="actionLoading() || !freezeReason || !freezeUntil"
                >
                  <mat-icon aria-hidden="true">pause_circle</mat-icon>
                  Confirm freeze
                </button>
                <button mat-button type="button" (click)="showFreeze = false">Cancel</button>
              </div>
            </mat-card-content>
          </mat-card>
        }

        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">{{ member.totalCheckIns }}</span>
            <span class="stat-label">Lifetime check-ins</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ member.lastCheckInAt ? (member.lastCheckInAt | date: 'mediumDate') : '—' }}</span>
            <span class="stat-label">Last visit</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ member.weightKg ?? '—' }}<small> kg</small></span>
            <span class="stat-label">Weight</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ member.heightCm ?? '—' }}<small> cm</small></span>
            <span class="stat-label">Height</span>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-main">
            <mat-card class="gym-card">
              <mat-card-content>
                <h2 class="section-title">Contact</h2>
                <mat-divider />
                <dl class="fact-grid">
                  <div><dt>E-mail</dt><dd>{{ member.email }}</dd></div>
                  <div><dt>Phone</dt><dd>{{ member.phone }}</dd></div>
                  <div><dt>Date of birth</dt><dd>{{ member.dateOfBirth | date: 'mediumDate' }}</dd></div>
                  <div><dt>Gender</dt><dd>{{ member.gender }}</dd></div>
                </dl>

                <h2 class="section-title">Address</h2>
                <mat-divider />
                <address>
                  {{ member.addressLine1 }}<br />
                  @if (member.addressLine2) { {{ member.addressLine2 }}<br /> }
                  {{ member.city }}@if (member.state) {, {{ member.state }}} @if (member.postalCode) { {{ member.postalCode }} }<br />
                  {{ member.country }}
                </address>
              </mat-card-content>
            </mat-card>

            <mat-card class="gym-card">
              <mat-card-content>
                <div class="section-head">
                  <h2 class="section-title">Health &amp; emergency</h2>
                  @if (!member.revealed) {
                    <span class="masked-chip"><mat-icon aria-hidden="true">lock</mat-icon> Masked</span>
                  }
                </div>
                <mat-divider />

                <div class="health-flag" [class.has-condition]="member.hasMedicalConditions">
                  <mat-icon aria-hidden="true">{{ member.hasMedicalConditions ? 'medical_information' : 'health_and_safety' }}</mat-icon>
                  <span>
                    {{ member.hasMedicalConditions ? 'Medical conditions disclosed' : 'No medical conditions disclosed' }}
                  </span>
                </div>

                <dl class="fact-grid">
                  <div class="span-2"><dt>Medical notes</dt><dd>{{ member.medicalNotes ?? 'None recorded' }}</dd></div>
                  <div><dt>Emergency contact</dt><dd>{{ member.emergencyContactName ?? '—' }}</dd></div>
                  <div><dt>Emergency phone</dt><dd>{{ member.emergencyContactPhone ?? '—' }}</dd></div>
                </dl>

                @if (!member.revealed && (member.hasMedicalConditions || member.emergencyContactName)) {
                  <p class="muted-note">Reveal this profile to view medical notes and the emergency contact. Access is intended for authorised staff only.</p>
                }
              </mat-card-content>
            </mat-card>
          </div>

          <div class="detail-side">
            <mat-card class="gym-card">
              <mat-card-content>
                <span class="eyebrow">Account</span>
                <h2 class="side-title">Membership record</h2>
                <dl class="side-facts">
                  <div><dt>Member number</dt><dd>{{ member.memberNumber }}</dd></div>
                  <div><dt>Status</dt><dd>{{ member.status }}</dd></div>
                  <div><dt>Joined</dt><dd>{{ member.joinedAt | date: 'mediumDate' }}</dd></div>
                  <div><dt>Branch</dt><dd class="mono">{{ member.branchId ?? 'Unassigned' }}</dd></div>
                  <div><dt>Member id</dt><dd class="mono">{{ member.id }}</dd></div>
                </dl>
              </mat-card-content>
            </mat-card>

            <mat-card class="gym-card privacy-card">
              <mat-card-content>
                <span class="kx-icon-badge" aria-hidden="true"><mat-icon>shield</mat-icon></span>
                <h2 class="side-title">Privacy by design</h2>
                <p>Contact, medical and emergency fields stay masked until an authorised staff member reveals them. Every reveal is explicit.</p>
                <p class="muted-note">Health data is only accepted with a recorded <code>health_data</code> consent.</p>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </div>
    }

    @if (!loading() && !member()) {
      <div class="page-container">
        <div class="empty-state">
          <div class="empty-art"><mat-icon aria-hidden="true">person_off</mat-icon></div>
          <h2>Member not found</h2>
          <p>The member may have been removed or the link is invalid.</p>
          <a mat-flat-button color="primary" routerLink="/members">Back to directory</a>
        </div>
      </div>
    }
  `,
  styles: [`
    .detail-hero { display:flex; align-items:center; gap:16px; padding:20px; border-radius:20px; background:var(--color-surface-raised); border:1px solid var(--color-border); margin-bottom:16px; flex-wrap:wrap; }
    .hero-avatar { width:66px; height:66px; border-radius:18px; background:var(--gradient-brandWarm); color:var(--color-on-accent); display:flex; align-items:center; justify-content:center; font-size:23px; font-weight:800; flex:none; }
    .hero-copy { flex:1; min-width:220px; }
    .hero-title-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
    .hero-title-row h1 { margin:0; font-size:26px; letter-spacing:-.03em; }
    .hero-meta { display:flex; gap:8px; flex-wrap:wrap; margin:6px 0 0; font-size:13px; color:var(--color-text-muted); }
    .hero-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .revealed-chip { display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:999px; background:color-mix(in srgb, var(--color-warning) 14%, transparent); color:var(--color-warning); font-size:12px; font-weight:700; }
    .revealed-chip mat-icon { font-size:16px; width:16px; height:16px; }
    .freeze-notice { margin-bottom:16px; }
    .freeze-notice strong { display:block; }
    .freeze-notice p { margin:2px 0 0; font-size:13px; }
    .freeze-card { margin-bottom:16px; }
    .freeze-card mat-card-content { padding:20px !important; }
    .freeze-head { display:flex; gap:12px; align-items:flex-start; margin-bottom:12px; }
    .freeze-head h2 { margin:0 0 3px; font-size:18px; }
    .freeze-head p { margin:0; font-size:13px; color:var(--color-text-muted); }
    .freeze-form { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-start; }
    .freeze-form mat-form-field:first-child { flex:1; min-width:240px; }
    .freeze-form button { margin-top:8px; }
    .stats-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-bottom:16px; }
    .stat-card { padding:16px; border-radius:14px; background:var(--color-surface-raised); border:1px solid var(--color-border); display:flex; flex-direction:column; gap:3px; }
    .stat-value { font-size:23px; font-weight:800; letter-spacing:-.02em; }
    .stat-value small { font-size:12px; font-weight:600; color:var(--color-text-muted); }
    .stat-label { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-muted); font-weight:600; }
    .detail-grid { display:grid; grid-template-columns:1fr; gap:16px; align-items:start; }
    .detail-main, .detail-side { display:flex; flex-direction:column; gap:16px; }
    .detail-main mat-card-content, .detail-side mat-card-content { padding:24px !important; }
    .section-head { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .section-title { margin:0 0 12px; font-size:17px; letter-spacing:-.02em; }
    .fact-grid + .section-title { margin-top:24px; }
    .masked-chip { display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:999px; background:var(--color-surface); color:var(--color-text-muted); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; margin-bottom:12px; }
    .masked-chip mat-icon { font-size:12px; width:12px; height:12px; }
    .fact-grid { display:grid; grid-template-columns:1fr; gap:14px; margin:16px 0 6px; }
    .fact-grid div { display:flex; flex-direction:column; gap:3px; }
    .fact-grid dt { font-size:10px; text-transform:uppercase; letter-spacing:.09em; font-weight:700; color:var(--color-text-muted); }
    .fact-grid dd { margin:0; font-size:14px; overflow-wrap:anywhere; }
    .span-2 { grid-column:1/-1; }
    address { font-style:normal; font-size:14px; line-height:1.7; color:var(--color-text); margin-top:14px; }
    .health-flag { display:flex; align-items:center; gap:8px; margin:14px 0 0; padding:10px 12px; border-radius:10px; background:var(--color-surface); font-size:13px; color:var(--color-text-muted); }
    .health-flag.has-condition { background:color-mix(in srgb, var(--color-warning) 12%, transparent); color:var(--color-warning); }
    .eyebrow { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.14em; color:var(--color-accent-text); }
    .side-title { margin:6px 0 12px; font-size:17px; }
    .side-facts { display:flex; flex-direction:column; gap:0; margin:0; }
    .side-facts div { display:flex; justify-content:space-between; gap:12px; padding:9px 0; border-bottom:1px solid var(--color-border); font-size:12px; }
    .side-facts div:last-child { border-bottom:none; }
    .side-facts dt { color:var(--color-text-muted); }
    .side-facts dd { margin:0; text-align:end; overflow-wrap:anywhere; }
    .mono { font-family:ui-monospace, SFMono-Regular, Consolas, monospace; font-size:11px; color:var(--color-text-muted); }
    .privacy-card p { font-size:13px; line-height:1.6; color:var(--color-text-muted); margin:0 0 8px; }
    .privacy-card code { color:var(--color-accent-text); background:var(--color-accent-soft); padding:1px 5px; border-radius:4px; }
    @media (min-width: 640px) { .stats-row { grid-template-columns:repeat(4,minmax(0,1fr)); } .fact-grid { grid-template-columns:1fr 1fr; } }
    @media (min-width: 960px) { .detail-grid { grid-template-columns:1.35fr .65fr; } }
  `],
})
export class MemberDetailComponent implements OnInit {
  /** Facade that owns detail state. */
  readonly facade = inject(MembersFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Loaded member. */
  readonly member = this.facade.detail;
  /** Whether the detail is loading. */
  readonly loading = this.facade.detailLoading;
  /** Whether an action is in flight. */
  readonly actionLoading = this.facade.actionLoading;

  /** Whether the freeze form is visible. */
  showFreeze = false;
  /** Freeze reason input. */
  freezeReason = '';
  /** Freeze end-date input. */
  freezeUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  /** Loads the member selected by the route. */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      void this.router.navigate(['/members']);
      return;
    }

    void this.facade.loadDetail(id);
  }

  /** Reloads the profile with sensitive fields revealed. */
  async reveal(): Promise<void> {
    await this.facade.reveal();
  }

  /** Freezes the member using the form values. */
  async freeze(): Promise<void> {
    if (!this.freezeReason || !this.freezeUntil) return;
    const frozen = await this.facade.freeze({
      reason: this.freezeReason.trim(),
      frozenUntil: new Date(`${this.freezeUntil}T00:00:00Z`).toISOString(),
    });
    if (frozen) {
      this.showFreeze = false;
      this.freezeReason = '';
    }
  }

  /** Returns the member to active status. */
  async unfreeze(): Promise<void> {
    await this.facade.unfreeze();
  }

  /**
   * Returns the initials of a full name.
   *
   * @param name - Member full name.
   * @returns Up to two uppercase initials.
   */
  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }
}
