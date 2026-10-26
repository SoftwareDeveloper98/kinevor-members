import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  AddProgressRequest,
  ApiEnvelope,
  ErasureResult,
  FreezeMemberRequest,
  MemberConsent,
  MemberDetail,
  MemberDevice,
  MemberListQuery,
  MemberPrivacyExport,
  MEMBERS_API_BASE_URL,
  MembersGateway,
  MemberSummary,
  PagedResult,
  ProgressEntry,
  RegisterMemberRequest,
  UpdateMemberRequest,
} from './member.model';

/** Typed HTTP gateway for the members API. */
@Injectable()
export class HttpMembersGateway implements MembersGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(MEMBERS_API_BASE_URL).replace(/\/$/, '');

  /** {@inheritDoc MembersGateway.list} */
  async list(query: MemberListQuery): Promise<PagedResult<MemberSummary>> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('pageSize', query.pageSize ?? 20);

    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);

    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<PagedResult<MemberSummary>>>(`${this.baseUrl}/members`, { params }),
    );
    return response.data;
  }

  /** {@inheritDoc MembersGateway.byId} */
  async byId(id: string, reveal: boolean): Promise<MemberDetail> {
    const params = new HttpParams().set('reveal', reveal);
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MemberDetail>>(`${this.baseUrl}/members/${id}`, { params }),
    );
    return response.data;
  }

  /** {@inheritDoc MembersGateway.register} */
  async register(request: RegisterMemberRequest): Promise<{ id: string }> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<{ id: string }>>(`${this.baseUrl}/members`, request),
    );
    return response.data;
  }

  /** {@inheritDoc MembersGateway.update} */
  async update(id: string, request: UpdateMemberRequest): Promise<void> {
    await firstValueFrom(
      this.http.patch<ApiEnvelope<unknown>>(`${this.baseUrl}/members/${id}`, request),
    );
  }

  /** {@inheritDoc MembersGateway.freeze} */
  async freeze(id: string, request: FreezeMemberRequest): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiEnvelope<unknown>>(`${this.baseUrl}/members/${id}/freeze`, request),
    );
  }

  /** {@inheritDoc MembersGateway.unfreeze} */
  async unfreeze(id: string): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiEnvelope<unknown>>(`${this.baseUrl}/members/${id}/unfreeze`, {}),
    );
  }

  /** {@inheritDoc MembersGateway.profile} */
  async profile(): Promise<MemberDetail> {
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MemberDetail>>(`${this.baseUrl}/me/profile`),
    );
    return response.data;
  }

  /** {@inheritDoc MembersGateway.updateProfile} */
  async updateProfile(request: UpdateMemberRequest): Promise<void> {
    await firstValueFrom(
      this.http.patch<ApiEnvelope<unknown>>(`${this.baseUrl}/me/profile`, request),
    );
  }

  /** {@inheritDoc MembersGateway.progress} */
  async progress(): Promise<ProgressEntry[]> {
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<ProgressEntry[]>>(`${this.baseUrl}/me/progress`),
    );
    return response.data;
  }

  /** {@inheritDoc MembersGateway.addProgress} */
  async addProgress(request: AddProgressRequest): Promise<{ id: string }> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<{ id: string }>>(`${this.baseUrl}/me/progress`, request),
    );
    return response.data;
  }

  /** {@inheritDoc MembersGateway.consents} */
  async consents(): Promise<MemberConsent[]> {
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MemberConsent[]>>(`${this.baseUrl}/me/consents`),
    );
    return response.data;
  }

  /** {@inheritDoc MembersGateway.grantConsent} */
  async grantConsent(key: string): Promise<void> {
    await firstValueFrom(
      this.http.post<ApiEnvelope<unknown>>(`${this.baseUrl}/me/consents/${key}`, {}),
    );
  }

  /** {@inheritDoc MembersGateway.withdrawConsent} */
  async withdrawConsent(key: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiEnvelope<unknown>>(`${this.baseUrl}/me/consents/${key}`),
    );
  }

  /** {@inheritDoc MembersGateway.devices} */
  async devices(): Promise<MemberDevice[]> {
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MemberDevice[]>>(`${this.baseUrl}/me/devices`),
    );
    return response.data;
  }

  /** {@inheritDoc MembersGateway.registerDevice} */
  async registerDevice(token: string, platform: string): Promise<{ id: string }> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<{ id: string }>>(`${this.baseUrl}/me/devices`, { token, platform }),
    );
    return response.data;
  }

  /** {@inheritDoc MembersGateway.removeDevice} */
  async removeDevice(token: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<ApiEnvelope<unknown>>(`${this.baseUrl}/me/devices`, { body: { token } }),
    );
  }

  /** {@inheritDoc MembersGateway.exportData} */
  async exportData(): Promise<MemberPrivacyExport> {
    const response = await firstValueFrom(
      this.http.get<ApiEnvelope<MemberPrivacyExport>>(`${this.baseUrl}/me/privacy/export`),
    );
    return response.data;
  }

  /** {@inheritDoc MembersGateway.eraseData} */
  async eraseData(): Promise<ErasureResult> {
    const response = await firstValueFrom(
      this.http.post<ApiEnvelope<ErasureResult>>(
        `${this.baseUrl}/me/privacy/erasure`,
        {},
      ),
    );
    return response.data;
  }
}
