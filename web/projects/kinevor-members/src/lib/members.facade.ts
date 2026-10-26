import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  FreezeMemberRequest,
  MemberDetail,
  MemberListQuery,
  MEMBERS_GATEWAY,
  MemberSummary,
  RegisterMemberRequest,
} from './member.model';

/** Directory, detail and lifecycle state for staff member management. */
@Injectable()
export class MembersFacade {
  private readonly gateway = inject(MEMBERS_GATEWAY);

  private readonly itemsState = signal<MemberSummary[]>([]);
  private readonly totalState = signal(0);
  private readonly loadingState = signal(false);
  private readonly detailState = signal<MemberDetail | null>(null);
  private readonly detailLoadingState = signal(false);
  private readonly actionState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly queryState = signal<MemberListQuery>({ page: 1, pageSize: 20 });

  /** Current page of members. */
  readonly members = this.itemsState.asReadonly();
  /** Total members matching the current filters. */
  readonly total = this.totalState.asReadonly();
  /** Whether the directory is loading. */
  readonly loading = this.loadingState.asReadonly();
  /** Member selected on the detail page. */
  readonly detail = this.detailState.asReadonly();
  /** Whether the detail page is loading. */
  readonly detailLoading = this.detailLoadingState.asReadonly();
  /** Whether a lifecycle action is in flight. */
  readonly actionLoading = this.actionState.asReadonly();
  /** Last failure message. */
  readonly error = this.errorState.asReadonly();
  /** Current directory filters. */
  readonly query = this.queryState.asReadonly();
  /** Active members on the current page. */
  readonly activeCount = computed(
    () => this.itemsState().filter((member) => member.status === 'Active').length,
  );
  /** Frozen members on the current page. */
  readonly frozenCount = computed(
    () => this.itemsState().filter((member) => member.status === 'Frozen').length,
  );
  /** Average age on the current page. */
  readonly averageAge = computed(() => {
    const items = this.itemsState();
    if (items.length === 0) return 0;
    return Math.round(items.reduce((sum, member) => sum + member.age, 0) / items.length);
  });

  /** Loads the directory using the current filters. */
  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const page = await this.gateway.list(this.queryState());
      this.itemsState.set(page.items);
      this.totalState.set(page.totalCount);
    } catch (error) {
      this.errorState.set(this.messageFor(error));
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Merges directory filters and reloads.
   *
   * @param patch - Filter fields to change.
   */
  async updateQuery(patch: Partial<MemberListQuery>): Promise<void> {
    this.queryState.update((query) => ({ ...query, ...patch }));
    await this.load();
  }

  /**
   * Loads one member into detail state.
   *
   * @param id - Member identifier.
   * @param reveal - Whether sensitive fields may be returned.
   */
  async loadDetail(id: string, reveal = false): Promise<MemberDetail | null> {
    this.detailLoadingState.set(true);
    this.errorState.set(null);

    try {
      const detail = await this.gateway.byId(id, reveal);
      this.detailState.set(detail);
      return detail;
    } catch (error) {
      this.detailState.set(null);
      this.errorState.set(this.messageFor(error));
      return null;
    } finally {
      this.detailLoadingState.set(false);
    }
  }

  /** Reloads the current detail with sensitive fields revealed. */
  async reveal(): Promise<void> {
    const detail = this.detailState();
    if (!detail) return;
    await this.loadDetail(detail.id, true);
  }

  /**
   * Registers a member.
   *
   * @param request - Registration payload.
   * @returns New member id, or null on failure.
   */
  async register(request: RegisterMemberRequest): Promise<string | null> {
    this.actionState.set(true);
    this.errorState.set(null);

    try {
      const created = await this.gateway.register(request);
      return created.id;
    } catch (error) {
      this.errorState.set(this.messageFor(error));
      return null;
    } finally {
      this.actionState.set(false);
    }
  }

  /**
   * Freezes the member shown on the detail page.
   *
   * @param request - Freeze reason and end date.
   * @returns Whether the operation succeeded.
   */
  async freeze(request: FreezeMemberRequest): Promise<boolean> {
    const detail = this.detailState();
    if (!detail) return false;

    this.actionState.set(true);
    this.errorState.set(null);

    try {
      await this.gateway.freeze(detail.id, request);
      await this.loadDetail(detail.id, detail.revealed);
      return true;
    } catch (error) {
      this.errorState.set(this.messageFor(error));
      return false;
    } finally {
      this.actionState.set(false);
    }
  }

  /**
   * Unfreezes the member shown on the detail page.
   *
   * @returns Whether the operation succeeded.
   */
  async unfreeze(): Promise<boolean> {
    const detail = this.detailState();
    if (!detail) return false;

    this.actionState.set(true);
    this.errorState.set(null);

    try {
      await this.gateway.unfreeze(detail.id);
      await this.loadDetail(detail.id, detail.revealed);
      return true;
    } catch (error) {
      this.errorState.set(this.messageFor(error));
      return false;
    } finally {
      this.actionState.set(false);
    }
  }

  /** Clears the selected member. */
  clearDetail(): void {
    this.detailState.set(null);
    this.errorState.set(null);
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'The members API is not reachable. Start the demo host on port 5083.';
      }
      if (error.status === 404) return 'The member could not be found.';
      return (error.error as { message?: string } | null)?.message ?? 'The request failed. Try again.';
    }

    return 'The request failed. Try again.';
  }
}
