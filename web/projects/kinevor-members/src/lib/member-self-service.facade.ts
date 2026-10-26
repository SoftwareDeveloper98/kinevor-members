import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AddProgressRequest,
  ErasureResult,
  MemberConsent,
  MemberDevice,
  MemberDetail,
  MEMBERS_GATEWAY,
  MemberPrivacyExport,
  ProgressEntry,
} from './member.model';

/** Member self-service profile, progress, consent, device and privacy state. */
@Injectable()
export class MemberSelfServiceFacade {
  private readonly gateway = inject(MEMBERS_GATEWAY);

  private readonly profileState = signal<MemberDetail | null>(null);
  private readonly progressState = signal<ProgressEntry[]>([]);
  private readonly consentsState = signal<MemberConsent[]>([]);
  private readonly devicesState = signal<MemberDevice[]>([]);
  private readonly loadingState = signal(false);
  private readonly actionState = signal(false);
  private readonly errorState = signal<string | null>(null);

  /** Authenticated member profile. */
  readonly profile = this.profileState.asReadonly();
  /** Progress entries, newest first. */
  readonly progress = this.progressState.asReadonly();
  /** Consent history. */
  readonly consents = this.consentsState.asReadonly();
  /** Registered push devices. */
  readonly devices = this.devicesState.asReadonly();
  /** Whether the initial load is in flight. */
  readonly loading = this.loadingState.asReadonly();
  /** Whether a consent or progress action is in flight. */
  readonly actionLoading = this.actionState.asReadonly();
  /** Last failure message. */
  readonly error = this.errorState.asReadonly();
  /** Number of granted consents. */
  readonly grantedConsents = computed(
    () => this.consentsState().filter((consent) => consent.granted).length,
  );
  /** Latest progress value, when one exists. */
  readonly latestProgress = computed(() => this.progressState()[0] ?? null);

  /** Loads profile, progress, consents and devices in parallel. */
  async load(): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const [profile, progress, consents, devices] = await Promise.all([
        this.gateway.profile(),
        this.gateway.progress(),
        this.gateway.consents(),
        this.gateway.devices(),
      ]);
      this.profileState.set(profile);
      this.progressState.set(progress);
      this.consentsState.set(consents);
      this.devicesState.set(devices);
    } catch (error) {
      this.errorState.set(this.messageFor(error));
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Grants a consent key and refreshes the list.
   *
   * @param key - Consent key such as `marketing`.
   */
  async grantConsent(key: string): Promise<void> {
    await this.changeConsent(() => this.gateway.grantConsent(key));
  }

  /**
   * Withdraws a consent key and refreshes the list.
   *
   * @param key - Consent key such as `marketing`.
   */
  async withdrawConsent(key: string): Promise<void> {
    await this.changeConsent(() => this.gateway.withdrawConsent(key));
  }

  /**
   * Records a progress entry and refreshes the timeline.
   *
   * @param request - Progress payload.
   * @returns Whether the entry was recorded.
   */
  async addProgress(request: AddProgressRequest): Promise<boolean> {
    this.actionState.set(true);
    this.errorState.set(null);

    try {
      await this.gateway.addProgress(request);
      this.progressState.set(await this.gateway.progress());
      return true;
    } catch (error) {
      this.errorState.set(this.messageFor(error));
      return false;
    } finally {
      this.actionState.set(false);
    }
  }

  /** Returns a personal-data export for download. */
  async exportData(): Promise<MemberPrivacyExport | null> {
    this.actionState.set(true);
    this.errorState.set(null);

    try {
      return await this.gateway.exportData();
    } catch (error) {
      this.errorState.set(this.messageFor(error));
      return null;
    } finally {
      this.actionState.set(false);
    }
  }

  /** Requests erasure of the authenticated member's data. */
  async eraseData(): Promise<ErasureResult | null> {
    this.actionState.set(true);
    this.errorState.set(null);

    try {
      return await this.gateway.eraseData();
    } catch (error) {
      this.errorState.set(this.messageFor(error));
      return null;
    } finally {
      this.actionState.set(false);
    }
  }

  private async changeConsent(action: () => Promise<void>): Promise<void> {
    this.actionState.set(true);
    this.errorState.set(null);

    try {
      await action();
      this.consentsState.set(await this.gateway.consents());
    } catch (error) {
      this.errorState.set(this.messageFor(error));
    } finally {
      this.actionState.set(false);
    }
  }

  private messageFor(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'The members API is not reachable. Start the demo host on port 5083.';
      }
      if (error.status === 403) {
        return 'This demo needs the X-Demo-Member header for the signed-in member.';
      }
      return (error.error as { message?: string } | null)?.message ?? 'The request failed. Try again.';
    }

    return 'The request failed. Try again.';
  }
}
