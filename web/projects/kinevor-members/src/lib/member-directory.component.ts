import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MEMBER_STATUSES } from './member.model';
import { MembersFacade } from './members.facade';

/** Staff member directory with search, status filter, stats and paging. */
@Component({
  selector: 'kinevor-member-directory',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <span class="eyebrow">People</span>
          <h1 class="page-title">Member directory</h1>
        </div>
        <div class="header-actions">
          <a mat-stroked-button routerLink="/me">
            <mat-icon aria-hidden="true">badge</mat-icon>
            My profile
          </a>
          <a mat-flat-button color="primary" routerLink="/members/new">
            <mat-icon aria-hidden="true">person_add</mat-icon>
            Register member
          </a>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-icon stat-icon-accent" aria-hidden="true"><mat-icon>groups</mat-icon></span>
          <div>
            <span class="stat-value">{{ total() }}</span>
            <span class="stat-label">Members</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon stat-icon-success" aria-hidden="true"><mat-icon>check_circle</mat-icon></span>
          <div>
            <span class="stat-value">{{ activeCount() }}</span>
            <span class="stat-label">Active now</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon stat-icon-info" aria-hidden="true"><mat-icon>ac_unit</mat-icon></span>
          <div>
            <span class="stat-value">{{ frozenCount() }}</span>
            <span class="stat-label">Frozen</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon stat-icon-warning" aria-hidden="true"><mat-icon>cake</mat-icon></span>
          <div>
            <span class="stat-value">{{ averageAge() }}</span>
            <span class="stat-label">Avg. age</span>
          </div>
        </div>
      </div>

      <mat-card class="gym-card filters-card">
        <mat-card-content>
          <div class="filters-row">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search members</mat-label>
              <input
                matInput
                [(ngModel)]="search"
                (ngModelChange)="search$.next($event)"
                placeholder="Name, e-mail or member number"
              />
              <mat-icon matSuffix aria-hidden="true">search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="status-field">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="status" (selectionChange)="applyStatus($event.value)">
                <mat-option value="">All statuses</mat-option>
                @for (option of statuses; track option) {
                  <mat-option [value]="option">{{ option }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button type="button" class="refresh-button" (click)="refresh()">
              <mat-icon aria-hidden="true">refresh</mat-icon>
              Refresh
            </button>
          </div>

          @if (facade.error(); as error) {
            <p class="notice notice-error" role="alert">{{ error }}</p>
          }
        </mat-card-content>
      </mat-card>

      @if (loading()) {
        <div class="table-loading" role="status">
          <mat-spinner diameter="48" />
          <span>Loading members…</span>
        </div>
      }

      @if (!loading()) {
        @if (members().length > 0) {
          <div class="member-grid">
            @for (member of members(); track member.id) {
              <a class="member-card" [routerLink]="['/members', member.id]">
                <div class="member-top">
                  <span class="avatar" aria-hidden="true">{{ initials(member.fullName) }}</span>
                  <div class="member-heading">
                    <strong>{{ member.fullName }}</strong>
                    <span class="member-number">{{ member.memberNumber }}</span>
                  </div>
                  <span class="status-chip" [class]="'status-' + member.status.toLowerCase()">
                    {{ member.status }}
                  </span>
                </div>

                <dl class="member-facts">
                  <div><dt>Age</dt><dd>{{ member.age }}</dd></div>
                  <div><dt>Gender</dt><dd>{{ member.gender }}</dd></div>
                  <div><dt>Joined</dt><dd>{{ member.joinedAt | date: 'MMM y' }}</dd></div>
                </dl>

                <div class="member-contact">
                  <span><mat-icon aria-hidden="true">mail</mat-icon>{{ member.email }}</span>
                  <span><mat-icon aria-hidden="true">phone</mat-icon>{{ member.phone }}</span>
                </div>

                <div class="member-foot">
                  <span class="muted-note">Masked contact · reveal in profile</span>
                  <span class="open-link">Open profile <mat-icon aria-hidden="true">arrow_forward</mat-icon></span>
                </div>
              </a>
            }
          </div>

          <mat-paginator
            [length]="total()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[8, 20, 50]"
            (page)="onPage($event)"
            aria-label="Member directory pages"
          />
        } @else {
          <div class="empty-state">
            <div class="empty-art"><mat-icon aria-hidden="true">person_search</mat-icon></div>
            <h2>No members match these filters</h2>
            <p>Try a different name or clear the status filter.</p>
            <button mat-stroked-button type="button" (click)="clearFilters()">Clear filters</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page-header > div:first-child { display:flex; flex-direction:column; gap:4px; }
    .eyebrow { font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--color-accent-text); }
    .page-header { align-items:flex-end; }
    .header-actions { display:flex; gap:10px; flex-wrap:wrap; }
    .stats-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
    .stat-card { display:flex; align-items:center; gap:12px; padding:16px; border-radius:16px; background:var(--color-surface-raised); border:1px solid var(--color-border); }
    .stat-icon { width:42px; height:42px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center; flex:none; }
    .stat-icon mat-icon { font-size:21px; width:21px; height:21px; }
    .stat-icon-accent { background:var(--color-accent-soft); color:var(--color-accent-text); }
    .stat-icon-success { background:color-mix(in srgb, var(--color-success) 14%, transparent); color:var(--color-success); }
    .stat-icon-info { background:color-mix(in srgb, var(--color-info) 14%, transparent); color:var(--color-info); }
    .stat-icon-warning { background:color-mix(in srgb, var(--color-warning) 14%, transparent); color:var(--color-warning); }
    .stat-value { display:block; font-size:24px; font-weight:800; line-height:1; color:var(--color-text); }
    .stat-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-muted); }
    .filters-card { margin-bottom:16px; }
    .filters-card mat-card-content { padding:16px 16px 4px !important; }
    .filters-row { display:flex; gap:12px; flex-wrap:wrap; align-items:flex-start; }
    .search-field { flex:1; min-width:240px; }
    .status-field { width:190px; }
    .refresh-button { margin-top:8px; }
    .member-grid { display:grid; grid-template-columns:1fr; gap:12px; }
    .member-card { display:flex; flex-direction:column; gap:14px; padding:18px; border-radius:18px; background:var(--color-surface-raised); border:1px solid var(--color-border); color:var(--color-text); text-decoration:none; transition:border-color .2s ease, transform .2s ease; }
    .member-card:hover { border-color:color-mix(in srgb, var(--color-accent-fill) 40%, transparent); transform:translateY(-2px); }
    .member-top { display:flex; align-items:center; gap:12px; }
    .avatar { width:46px; height:46px; border-radius:14px; background:var(--gradient-brandWarm); color:var(--color-on-accent); font-weight:800; display:flex; align-items:center; justify-content:center; flex:none; }
    .member-heading { display:flex; flex-direction:column; gap:2px; flex:1; min-width:0; }
    .member-heading strong { font-size:17px; letter-spacing:-.01em; }
    .member-number { font-size:11px; font-weight:600; letter-spacing:.06em; color:var(--color-text-muted); }
    .member-facts { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:0; }
    .member-facts div { display:flex; flex-direction:column; gap:2px; padding:8px 10px; border-radius:10px; background:var(--color-surface); }
    .member-facts dt { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:var(--color-text-muted); }
    .member-facts dd { margin:0; font-size:13px; font-weight:600; }
    .member-contact { display:flex; flex-direction:column; gap:4px; }
    .member-contact span { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--color-text-muted); }
    .member-contact mat-icon { font-size:14px; width:14px; height:14px; }
    .member-foot { display:flex; align-items:center; justify-content:space-between; gap:8px; border-top:1px solid var(--color-border); padding-top:12px; }
    .member-foot .muted-note { font-size:11px; }
    .open-link { display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:700; color:var(--color-accent-text); }
    .open-link mat-icon { font-size:15px; width:15px; height:15px; }
    .empty-state h2 { margin:0; font-size:20px; color:var(--color-text); }
    .empty-state p { margin:0; }
    @media (min-width: 700px) { .member-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .stats-row { grid-template-columns:repeat(4,minmax(0,1fr)); } }
    @media (min-width: 1120px) { .member-grid { grid-template-columns:repeat(3,minmax(0,1fr)); } }
  `],
})
export class MemberDirectoryComponent implements OnInit, OnDestroy {
  /** Facade that owns directory state. */
  readonly facade = inject(MembersFacade);

  /** Debounced search stream. */
  readonly search$ = new Subject<string>();
  /** Current page of members. */
  readonly members = this.facade.members;
  /** Total members matching the filters. */
  readonly total = this.facade.total;
  /** Whether the directory is loading. */
  readonly loading = this.facade.loading;
  /** Active members on the current page. */
  readonly activeCount = this.facade.activeCount;
  /** Frozen members on the current page. */
  readonly frozenCount = this.facade.frozenCount;
  /** Average age on the current page. */
  readonly averageAge = this.facade.averageAge;
  /** Status filter options. */
  readonly statuses = MEMBER_STATUSES;
  private readonly destroy$ = new Subject<void>();

  /** Current search box value. */
  search = '';
  /** Current status filter. */
  status = '';
  /** Current page size. */
  pageSize = 20;

  /** Wires debounced search and loads the first page. */
  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => void this.facade.updateQuery({ page: 1, search: this.search || undefined }));
    void this.facade.load();
  }

  /** Releases the search subscription. */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Applies the status filter.
   *
   * @param value - Selected status, or an empty string for all.
   */
  applyStatus(value: string): void {
    void this.facade.updateQuery({ page: 1, status: value || undefined });
  }

  /** Reloads the directory. */
  refresh(): void {
    void this.facade.load();
  }

  /** Clears search and status filters. */
  clearFilters(): void {
    this.search = '';
    this.status = '';
    void this.facade.updateQuery({ page: 1, search: undefined, status: undefined });
  }

  /**
   * Applies a paginator event.
   *
   * @param event - Material page event.
   */
  onPage(event: PageEvent): void {
    this.pageSize = event.pageSize;
    void this.facade.updateQuery({ page: event.pageIndex + 1, pageSize: event.pageSize });
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
