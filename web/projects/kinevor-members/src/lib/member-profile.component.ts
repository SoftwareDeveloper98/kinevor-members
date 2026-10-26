import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AddProgressRequest, CONSENT_KEYS, PROGRESS_KINDS } from './member.model';
import { MemberSelfServiceFacade } from './member-self-service.facade';

/** Member self-service profile: progress, consents, devices and privacy. */
@Component({
  selector: 'kinevor-member-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
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
    MatSelectModule,
  ],
  template: `
    <div class="page-container">
      @if (loading()) {
        <div class="table-loading" role="status">
          <mat-spinner diameter="52" />
          <span>Loading your member profile…</span>
        </div>
      }

      @if (!loading() && profile(); as member) {
        <div class="page-header">
          <div>
            <span class="eyebrow">Member area</span>
            <h1 class="page-title">My profile</h1>
          </div>
          <div class="header-actions">
            <a mat-stroked-button routerLink="/members">
              <mat-icon aria-hidden="true">groups</mat-icon>
              Staff directory
            </a>
            <button mat-flat-button color="primary" type="button" (click)="download()" [disabled]="actionLoading()">
              <mat-icon aria-hidden="true">download</mat-icon>
              Download my data
            </button>
          </div>
        </div>

        <div class="profile-hero">
          <span class="hero-avatar" aria-hidden="true">{{ initials(member.fullName) }}</span>
          <div class="hero-copy">
            <div class="hero-title-row">
              <h2>{{ member.fullName }}</h2>
              <span class="status-chip" [ngClass]="'status-' + member.status.toLowerCase()">{{ member.status }}</span>
            </div>
            <p class="hero-meta">
              <span>{{ member.memberNumber }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ member.email }}</span>
              <span aria-hidden="true">·</span>
              <span>{{ member.phone }}</span>
            </p>
          </div>
          <div class="hero-badge">
            <mat-icon aria-hidden="true">verified_user</mat-icon>
            <span>Privacy controls<br /><small>Export and consent in one place</small></span>
          </div>
        </div>

        @if (facade.error(); as error) {
          <p class="notice notice-error" role="alert"><mat-icon aria-hidden="true">error</mat-icon>{{ error }}</p>
        }

        @if (eraseMessage) {
          <p class="notice notice-success" role="status"><mat-icon aria-hidden="true">task_alt</mat-icon>{{ eraseMessage }}</p>
        }

        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">{{ member.age }}</span>
            <span class="stat-label">Age</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ member.totalCheckIns }}</span>
            <span class="stat-label">Check-ins</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ member.weightKg ?? '—' }}<small> kg</small></span>
            <span class="stat-label">Weight</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ grantedConsents() }}/{{ consents().length }}</span>
            <span class="stat-label">Consents granted</span>
          </div>
        </div>

        <div class="content-grid">
          <div class="main-stack">
            <mat-card class="gym-card">
              <mat-card-content>
                <div class="section-head">
                  <h2 class="section-title">Progress timeline</h2>
                  <span class="chip">{{ progress().length }} entries</span>
                </div>
                <mat-divider />

                <div class="progress-list">
                  @for (entry of progress(); track entry.id) {
                    <div class="progress-item">
                      <span class="progress-icon" [ngClass]="kindClass(entry.kind)" aria-hidden="true">
                        <mat-icon>{{ kindIcon(entry.kind) }}</mat-icon>
                      </span>
                      <div class="progress-copy">
                        <strong>{{ entry.label ?? kindLabel(entry.kind) }}</strong>
                        <span class="progress-meta">{{ entry.recordedAt | date: 'mediumDate' }}</span>
                        @if (entry.notes) { <p>{{ entry.notes }}</p> }
                      </div>
                      <span class="progress-value">
                        {{ entry.value !== null ? (entry.value | number: '1.0-1') : '—' }}
                        <small>{{ entry.unit }}</small>
                      </span>
                    </div>
                  }

                  @if (progress().length === 0) {
                    <p class="muted-note empty-line">No progress recorded yet. Add your first entry below.</p>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="gym-card">
              <mat-card-content>
                <h2 class="section-title">Log progress</h2>
                <mat-divider />
                <div class="progress-form">
                  <mat-form-field appearance="outline">
                    <mat-label>Kind</mat-label>
                    <mat-select [(ngModel)]="progressKind">
                      @for (kind of kinds; track kind) {
                        <mat-option [value]="kind">{{ kindLabel(kind) }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Label (optional)</mat-label>
                    <input matInput [(ngModel)]="progressLabel" placeholder="Waist, back squat…" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="value-field">
                    <mat-label>Value</mat-label>
                    <input matInput type="number" [(ngModel)]="progressValue" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="unit-field">
                    <mat-label>Unit</mat-label>
                    <input matInput [(ngModel)]="progressUnit" placeholder="kg, cm" />
                  </mat-form-field>
                  <button
                    mat-flat-button
                    color="primary"
                    type="button"
                    (click)="addProgress()"
                    [disabled]="actionLoading() || progressValue === null"
                  >
                    <mat-icon aria-hidden="true">add</mat-icon>
                    Add entry
                  </button>
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="gym-card">
              <mat-card-content>
                <h2 class="section-title">Contact &amp; emergency</h2>
                <mat-divider />
                <dl class="fact-grid">
                  <div><dt>Date of birth</dt><dd>{{ member.dateOfBirth | date: 'mediumDate' }}</dd></div>
                  <div><dt>Address</dt><dd>{{ member.addressLine1 }}, {{ member.city }}, {{ member.country }}</dd></div>
                  <div><dt>Emergency contact</dt><dd>{{ member.emergencyContactName ?? '—' }}</dd></div>
                  <div><dt>Emergency phone</dt><dd>{{ member.emergencyContactPhone ?? '—' }}</dd></div>
                  <div class="span-2"><dt>Medical notes</dt><dd>{{ member.medicalNotes ?? 'None recorded' }}</dd></div>
                </dl>
              </mat-card-content>
            </mat-card>
          </div>

          <aside class="side-stack">
            <mat-card class="gym-card">
              <mat-card-content>
                <h2 class="section-title">Consents</h2>
                <p class="section-note">Version {{ consents()[0]?.version ?? '2026-10' }} · withdraw at any time.</p>
                <div class="consent-list">
                  @for (key of consentKeys; track key) {
                    <div class="consent-row">
                      <div class="consent-copy">
                        <strong>{{ consentLabel(key) }}</strong>
                        <small>{{ consentDescription(key) }}</small>
                      </div>
                      <button
                        mat-icon-button
                        type="button"
                        [attr.aria-label]="isGranted(key) ? 'Withdraw ' + consentLabel(key) : 'Grant ' + consentLabel(key)"
                        [disabled]="actionLoading()"
                        (click)="toggleConsent(key)"
                      >
                        <mat-icon [class.granted]="isGranted(key)">
                          {{ isGranted(key) ? 'toggle_on' : 'toggle_off' }}
                        </mat-icon>
                      </button>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="gym-card">
              <mat-card-content>
                <h2 class="section-title">Devices</h2>
                <div class="device-list">
                  @for (device of devices(); track device.id) {
                    <div class="device-row">
                      <span class="device-icon" aria-hidden="true"><mat-icon>{{ device.platform === 'ios' ? 'phone_iphone' : 'phone_android' }}</mat-icon></span>
                      <div>
                        <strong>{{ device.platform === 'ios' ? 'iPhone' : device.platform }}</strong>
                        <small class="mono">{{ device.tokenPreview }}</small>
                      </div>
                      <span class="device-date">{{ device.registeredAt | date: 'MMM d' }}</span>
                    </div>
                  }
                  @if (devices().length === 0) {
                    <p class="muted-note">No push devices registered.</p>
                  }
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card class="gym-card privacy-card">
              <mat-card-content>
                <span class="kx-icon-badge" aria-hidden="true"><mat-icon>shield</mat-icon></span>
                <h2 class="section-title">Your privacy rights</h2>
                <p>Export everything this module stores, or request erasure. Consent history is retained as a legal record.</p>
                <button mat-stroked-button type="button" (click)="download()" [disabled]="actionLoading()">
                  <mat-icon aria-hidden="true">download</mat-icon>
                  Export JSON
                </button>
                <button mat-button type="button" class="danger-link" (click)="erase()" [disabled]="actionLoading()">
                  Request erasure
                </button>
              </mat-card-content>
            </mat-card>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header > div:first-child { display:flex; flex-direction:column; gap:4px; }
    .eyebrow { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.16em; color:var(--color-accent-text); }
    .header-actions { display:flex; gap:10px; flex-wrap:wrap; }
    .profile-hero { display:flex; align-items:center; gap:16px; padding:20px; border-radius:20px; background:var(--color-surface-raised); border:1px solid var(--color-border); margin-bottom:16px; flex-wrap:wrap; }
    .hero-avatar { width:64px; height:64px; border-radius:18px; background:var(--gradient-brandWarm); color:var(--color-on-accent); display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800; flex:none; }
    .hero-copy { flex:1; min-width:220px; }
    .hero-title-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .hero-title-row h2 { margin:0; font-size:24px; letter-spacing:-.03em; }
    .hero-meta { display:flex; gap:8px; flex-wrap:wrap; margin:5px 0 0; font-size:12px; color:var(--color-text-muted); }
    .hero-badge { display:flex; align-items:center; gap:9px; padding:10px 14px; border-radius:12px; background:var(--color-accent-soft); color:var(--color-accent-text); font-size:11px; font-weight:700; line-height:1.4; }
    .hero-badge small { font-weight:500; color:var(--color-text-muted); font-size:10px; }
    .stats-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-bottom:16px; }
    .stat-card { padding:15px; border-radius:14px; background:var(--color-surface-raised); border:1px solid var(--color-border); display:flex; flex-direction:column; gap:3px; }
    .stat-value { font-size:22px; font-weight:800; }
    .stat-value small { font-size:11px; color:var(--color-text-muted); font-weight:600; }
    .stat-label { font-size:10px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:var(--color-text-muted); }
    .content-grid { display:grid; grid-template-columns:1fr; gap:16px; align-items:start; }
    .main-stack, .side-stack { display:flex; flex-direction:column; gap:16px; }
    .content-grid mat-card-content { padding:22px !important; }
    .section-head { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .section-title { margin:0 0 12px; font-size:17px; letter-spacing:-.02em; }
    .section-head .section-title { margin-bottom:12px; }
    .section-note { margin:-6px 0 12px; font-size:12px; color:var(--color-text-muted); line-height:1.5; }
    .progress-list { margin-top:6px; }
    .progress-item { display:flex; align-items:flex-start; gap:12px; padding:12px 0; border-bottom:1px solid var(--color-border); }
    .progress-item:last-child { border-bottom:none; }
    .progress-icon { width:38px; height:38px; border-radius:11px; background:var(--color-surface); color:var(--color-accent-text); display:flex; align-items:center; justify-content:center; flex:none; }
    .progress-icon mat-icon { font-size:19px; width:19px; height:19px; }
    .kind-pr { background:color-mix(in srgb, var(--color-warning) 14%, transparent); color:var(--color-warning); }
    .kind-measurement { background:color-mix(in srgb, var(--color-info) 14%, transparent); color:var(--color-info); }
    .progress-copy { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
    .progress-copy strong { font-size:14px; }
    .progress-copy p { margin:4px 0 0; font-size:12px; color:var(--color-text-muted); }
    .progress-meta { font-size:11px; color:var(--color-text-muted); }
    .progress-value { font-size:18px; font-weight:800; white-space:nowrap; }
    .progress-value small { font-size:10px; font-weight:600; color:var(--color-text-muted); }
    .empty-line { margin:0; padding:12px 0; }
    .progress-form { display:flex; gap:10px; flex-wrap:wrap; align-items:flex-start; }
    .progress-form mat-form-field { flex:1; min-width:150px; }
    .progress-form .value-field { flex:0 1 120px; min-width:100px; }
    .progress-form .unit-field { flex:0 1 110px; min-width:90px; }
    .progress-form button { margin-top:8px; }
    .fact-grid { display:grid; grid-template-columns:1fr; gap:12px; margin:14px 0 0; }
    .fact-grid div { display:flex; flex-direction:column; gap:2px; }
    .fact-grid dt { font-size:10px; text-transform:uppercase; letter-spacing:.09em; font-weight:700; color:var(--color-text-muted); }
    .fact-grid dd { margin:0; font-size:13px; overflow-wrap:anywhere; }
    .span-2 { grid-column:1/-1; }
    .consent-list { display:flex; flex-direction:column; }
    .consent-row { display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid var(--color-border); }
    .consent-row:last-child { border-bottom:none; }
    .consent-copy { flex:1; display:flex; flex-direction:column; gap:2px; }
    .consent-copy strong { font-size:13px; }
    .consent-copy small { font-size:11px; color:var(--color-text-muted); line-height:1.35; }
    .consent-row mat-icon { color:var(--color-text-muted); }
    .consent-row mat-icon.granted { color:var(--color-accent-text); }
    .device-list { display:flex; flex-direction:column; gap:10px; }
    .device-row { display:flex; align-items:center; gap:10px; }
    .device-icon { width:34px; height:34px; border-radius:9px; background:var(--color-surface); color:var(--color-accent-text); display:flex; align-items:center; justify-content:center; flex:none; }
    .device-icon mat-icon { font-size:17px; width:17px; height:17px; }
    .device-row div { flex:1; min-width:0; display:flex; flex-direction:column; gap:1px; }
    .device-row strong { font-size:13px; }
    .device-row small { font-size:10px; color:var(--color-text-muted); }
    .device-date { font-size:11px; color:var(--color-text-muted); }
    .mono { font-family:ui-monospace, SFMono-Regular, Consolas, monospace; }
    .privacy-card p { font-size:12px; line-height:1.6; color:var(--color-text-muted); margin:0 0 12px; }
    .danger-link { color:var(--color-error) !important; margin-top:4px; }
    .chip { padding:3px 10px; border-radius:999px; background:var(--color-accent-soft); color:var(--color-accent-text); font-size:11px; font-weight:700; }
    @media (min-width: 640px) { .stats-row { grid-template-columns:repeat(4,minmax(0,1fr)); } .fact-grid { grid-template-columns:1fr 1fr; } }
    @media (min-width: 980px) { .content-grid { grid-template-columns:1.35fr .65fr; } }
  `],
})
export class MemberProfileComponent implements OnInit {
  /** Facade that owns self-service state. */
  readonly facade = inject(MemberSelfServiceFacade);

  /** Loaded profile. */
  readonly profile = this.facade.profile;
  /** Progress timeline. */
  readonly progress = this.facade.progress;
  /** Consent records. */
  readonly consents = this.facade.consents;
  /** Registered devices. */
  readonly devices = this.facade.devices;
  /** Whether the initial load is in flight. */
  readonly loading = this.facade.loading;
  /** Whether an action is in flight. */
  readonly actionLoading = this.facade.actionLoading;
  /** Number of granted consents. */
  readonly grantedConsents = this.facade.grantedConsents;
  /** Consent keys rendered in the sidebar. */
  readonly consentKeys = CONSENT_KEYS;
  /** Progress kinds accepted by the API. */
  readonly kinds = PROGRESS_KINDS;

  /** Selected progress kind. */
  progressKind = 'Weight';
  /** Optional progress label. */
  progressLabel = '';
  /** Progress value. */
  progressValue: number | null = null;
  /** Progress unit. */
  progressUnit = 'kg';
  /** Erasure confirmation text. */
  eraseMessage = '';

  /** Loads the member area. */
  ngOnInit(): void {
    void this.facade.load();
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

  /**
   * Returns whether a consent key is currently granted.
   *
   * @param key - Consent key.
   */
  isGranted(key: string): boolean {
    return this.consents().find((consent) => consent.key === key)?.granted ?? false;
  }

  /**
   * Toggles a consent key.
   *
   * @param key - Consent key.
   */
  async toggleConsent(key: string): Promise<void> {
    if (this.isGranted(key)) {
      await this.facade.withdrawConsent(key);
    } else {
      await this.facade.grantConsent(key);
    }
  }

  /**
   * Returns the human label for a consent key.
   *
   * @param key - Consent key.
   */
  consentLabel(key: string): string {
    return (
      {
        health_data: 'Health data',
        marketing: 'Marketing',
        progress_photos: 'Progress photos',
        analytics: 'Analytics',
      }[key] ?? key
    );
  }

  /**
   * Returns the description for a consent key.
   *
   * @param key - Consent key.
   */
  consentDescription(key: string): string {
    return (
      {
        health_data: 'Medical notes and conditions',
        marketing: 'Offers, news and re-engagement',
        progress_photos: 'Photos attached to progress entries',
        analytics: 'Anonymized product usage',
      }[key] ?? ''
    );
  }

  /**
   * Returns a readable label for a progress kind.
   *
   * @param kind - API progress kind.
   */
  kindLabel(kind: string): string {
    return kind === 'PersonalRecord' ? 'Personal record' : kind;
  }

  /**
   * Returns the Material icon for a progress kind.
   *
   * @param kind - API progress kind.
   */
  kindIcon(kind: string): string {
    return (
      {
        Weight: 'monitor_weight',
        Measurement: 'straighten',
        PersonalRecord: 'emoji_events',
        Photo: 'photo_camera',
      }[kind] ?? 'trending_up'
    );
  }

  /**
   * Returns an extra class for a progress kind.
   *
   * @param kind - API progress kind.
   */
  kindClass(kind: string): string {
    return kind === 'PersonalRecord'
      ? 'kind-pr'
      : kind === 'Measurement'
        ? 'kind-measurement'
        : '';
  }

  /** Records the progress form values and resets the form. */
  async addProgress(): Promise<void> {
    if (this.progressValue === null) return;

    const request: AddProgressRequest = {
      kind: this.progressKind,
      label: this.progressLabel.trim() || null,
      value: Number(this.progressValue),
      unit: this.progressUnit.trim() || null,
      notes: null,
    };

    if (await this.facade.addProgress(request)) {
      this.progressLabel = '';
      this.progressValue = null;
    }
  }

  /** Downloads the member's module data as JSON. */
  async download(): Promise<void> {
    const data = await this.facade.exportData();
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `kinevor-member-${data.profile.memberNumber}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  /** Requests erasure after explicit confirmation. */
  async erase(): Promise<void> {
    if (!globalThis.confirm('Erase your profile, health data, progress and devices? This cannot be undone.')) {
      return;
    }

    const result = await this.facade.eraseData();
    if (result) this.eraseMessage = result.confirmation;
  }
}
