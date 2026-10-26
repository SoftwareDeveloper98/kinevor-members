import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { RegisterMemberRequest } from './member.model';
import { MembersFacade } from './members.facade';

/** Staff registration form for a new member. */
@Component({
  selector: 'kinevor-member-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <a mat-icon-button routerLink="/members" aria-label="Back to member directory" class="flip-rtl">
          <mat-icon aria-hidden="true">arrow_back</mat-icon>
        </a>
        <div class="title-block">
          <span class="eyebrow">New member</span>
          <h1 class="page-title">Register a member</h1>
          <p class="page-sub">Create the profile, capture consent and assign a member number automatically.</p>
        </div>
      </div>

      @if (facade.error(); as error) {
        <p class="notice notice-error" role="alert"><mat-icon aria-hidden="true">error</mat-icon>{{ error }}</p>
      }

      <form (ngSubmit)="submit()" #form="ngForm" class="register-layout">
        <div class="form-main">
          <mat-card class="gym-card">
            <mat-card-content>
              <h2 class="section-title">Identity</h2>
              <div class="field-grid">
                <mat-form-field appearance="outline">
                  <mat-label>First name</mat-label>
                  <input matInput name="firstName" [(ngModel)]="firstName" required />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Last name</mat-label>
                  <input matInput name="lastName" [(ngModel)]="lastName" required />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>E-mail address</mat-label>
                  <input matInput name="email" type="email" [(ngModel)]="email" required />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Phone number</mat-label>
                  <input matInput name="phone" [(ngModel)]="phone" placeholder="+447700900000" required />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Date of birth</mat-label>
                  <input matInput name="dateOfBirth" type="date" [(ngModel)]="dateOfBirth" required />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Gender</mat-label>
                  <mat-select name="gender" [(ngModel)]="gender" required>
                    @for (option of genders; track option) {
                      <mat-option [value]="option">{{ option }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="gym-card">
            <mat-card-content>
              <h2 class="section-title">Address</h2>
              <div class="field-grid">
                <mat-form-field appearance="outline" class="span-2">
                  <mat-label>Address line 1</mat-label>
                  <input matInput name="addressLine1" [(ngModel)]="addressLine1" required />
                </mat-form-field>
                <mat-form-field appearance="outline" class="span-2">
                  <mat-label>Address line 2 (optional)</mat-label>
                  <input matInput name="addressLine2" [(ngModel)]="addressLine2" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>City</mat-label>
                  <input matInput name="city" [(ngModel)]="city" required />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>State or region (optional)</mat-label>
                  <input matInput name="state" [(ngModel)]="state" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Country</mat-label>
                  <input matInput name="country" [(ngModel)]="country" required />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Postal code (optional)</mat-label>
                  <input matInput name="postalCode" [(ngModel)]="postalCode" />
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="gym-card">
            <mat-card-content>
              <h2 class="section-title">Health &amp; emergency</h2>
              <p class="section-note">Medical notes are sensitive and require an explicit health-data consent.</p>
              <div class="field-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Weight (kg, optional)</mat-label>
                  <input matInput name="weightKg" type="number" min="0" max="500" [(ngModel)]="weightKg" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Height (cm, optional)</mat-label>
                  <input matInput name="heightCm" type="number" min="0" max="300" [(ngModel)]="heightCm" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="span-2">
                  <mat-label>Medical notes (optional)</mat-label>
                  <textarea matInput name="medicalNotes" rows="2" [(ngModel)]="medicalNotes"></textarea>
                </mat-form-field>
                <mat-checkbox name="hasMedicalConditions" [(ngModel)]="hasMedicalConditions" class="span-2">
                  The member disclosed a medical condition
                </mat-checkbox>
                <mat-form-field appearance="outline">
                  <mat-label>Emergency contact name</mat-label>
                  <input matInput name="emergencyContactName" [(ngModel)]="emergencyContactName" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Emergency contact phone</mat-label>
                  <input matInput name="emergencyContactPhone" [(ngModel)]="emergencyContactPhone" />
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <aside class="form-side">
          <mat-card class="gym-card">
            <mat-card-content>
              <h2 class="section-title">Consent</h2>
              <p class="section-note">Consent is recorded with the current policy version.</p>
              <mat-checkbox [(ngModel)]="healthConsent" name="healthConsent">
                Health data processing
              </mat-checkbox>
              <mat-checkbox [(ngModel)]="marketingConsent" name="marketingConsent">
                Marketing messages
              </mat-checkbox>
              <mat-checkbox [(ngModel)]="analyticsConsent" name="analyticsConsent">
                Anonymized analytics
              </mat-checkbox>

              <button
                mat-flat-button
                color="primary"
                type="submit"
                class="submit"
                [disabled]="facade.actionLoading() || !isValid()"
              >
                @if (facade.actionLoading()) {
                  <mat-spinner diameter="18" class="btn-spinner" />
                }
                Register member
              </button>
              <a mat-button routerLink="/members" class="cancel">Cancel</a>
            </mat-card-content>
          </mat-card>

          <div class="notice notice-info">
            <mat-icon aria-hidden="true">info</mat-icon>
            <span>The member number is generated as <strong>KZN-YYYY-NNNNN</strong> when the profile is saved.</span>
          </div>
        </aside>
      </form>
    </div>
  `,
  styles: [`
    .page-header { align-items:flex-start; }
    .title-block { display:flex; flex-direction:column; gap:3px; }
    .eyebrow { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.16em; color:var(--color-accent-text); }
    .page-title { margin:0; }
    .page-sub { margin:0; font-size:13px; color:var(--color-text-muted); }
    .register-layout { display:grid; grid-template-columns:1fr; gap:16px; align-items:start; }
    .form-main { display:flex; flex-direction:column; gap:16px; }
    .form-main mat-card-content, .form-side mat-card-content { padding:22px !important; }
    .section-title { margin:0 0 14px; font-size:17px; letter-spacing:-.02em; }
    .section-note { margin:-8px 0 14px; font-size:12px; color:var(--color-text-muted); line-height:1.55; }
    .field-grid { display:grid; grid-template-columns:1fr; gap:4px 12px; }
    .span-2 { grid-column:1/-1; }
    .form-side { display:flex; flex-direction:column; gap:16px; position:sticky; top:80px; }
    .form-side mat-checkbox { display:block; margin-bottom:10px; }
    .submit { width:100%; margin-top:12px; height:48px; }
    .cancel { width:100%; margin-top:6px; }
    @media (min-width: 700px) { .field-grid { grid-template-columns:1fr 1fr; } }
    @media (min-width: 980px) { .register-layout { grid-template-columns:1fr 330px; } }
  `],
})
export class MemberRegisterComponent {
  /** Facade used to register the member. */
  readonly facade = inject(MembersFacade);
  private readonly router = inject(Router);

  /** Gender options accepted by the API. */
  readonly genders = ['Female', 'Male', 'NonBinary', 'PreferNotToSay'];

  firstName = '';
  lastName = '';
  email = '';
  phone = '';
  dateOfBirth = '1995-05-15';
  gender = 'PreferNotToSay';
  weightKg: number | null = null;
  heightCm: number | null = null;
  medicalNotes = '';
  hasMedicalConditions = false;
  addressLine1 = '';
  addressLine2 = '';
  city = '';
  state = '';
  country = 'United Kingdom';
  postalCode = '';
  emergencyContactName = '';
  emergencyContactPhone = '';
  healthConsent = false;
  marketingConsent = true;
  analyticsConsent = true;

  /** Whether the form has the fields required by the API. */
  isValid(): boolean {
    if (
      !this.firstName.trim() ||
      !this.lastName.trim() ||
      !this.email.trim() ||
      !this.phone.trim() ||
      !this.dateOfBirth ||
      !this.addressLine1.trim() ||
      !this.city.trim() ||
      !this.country.trim()
    ) {
      return false;
    }

    const needsHealthConsent =
      this.hasMedicalConditions || this.medicalNotes.trim().length > 0;
    return !needsHealthConsent || this.healthConsent;
  }

  /** Submits the registration and opens the new profile. */
  async submit(): Promise<void> {
    if (!this.isValid() || this.facade.actionLoading()) return;

    const request: RegisterMemberRequest = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim(),
      phone: this.phone.trim(),
      dateOfBirth: new Date(`${this.dateOfBirth}T00:00:00Z`).toISOString(),
      gender: this.gender,
      weightKg: this.numberOrNull(this.weightKg),
      heightCm: this.numberOrNull(this.heightCm),
      medicalNotes: this.medicalNotes.trim() || null,
      hasMedicalConditions: this.hasMedicalConditions,
      addressLine1: this.addressLine1.trim(),
      addressLine2: this.addressLine2.trim() || null,
      city: this.city.trim(),
      state: this.state.trim() || null,
      country: this.country.trim(),
      postalCode: this.postalCode.trim() || null,
      emergencyContactName: this.emergencyContactName.trim() || null,
      emergencyContactPhone: this.emergencyContactPhone.trim() || null,
      consents: [
        { key: 'health_data', granted: this.healthConsent },
        { key: 'marketing', granted: this.marketingConsent },
        { key: 'analytics', granted: this.analyticsConsent },
      ],
    };

    const id = await this.facade.register(request);
    if (id) await this.router.navigate(['/members', id]);
  }

  private numberOrNull(value: number | null): number | null {
    return value === null || value === undefined || Number.isNaN(value) ? null : Number(value);
  }
}
