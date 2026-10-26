import { InjectionToken } from '@angular/core';

/** Compact member row returned by the staff directory. */
export interface MemberSummary {
  readonly id: string;
  readonly memberNumber: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly gender: string;
  readonly age: number;
  readonly status: string;
  readonly photoUrl: string | null;
  readonly joinedAt: string;
}

/** Full member profile, with sensitive fields masked unless revealed. */
export interface MemberDetail {
  readonly id: string;
  readonly memberNumber: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly dateOfBirth: string;
  readonly age: number;
  readonly gender: string;
  readonly weightKg: number | null;
  readonly heightCm: number | null;
  readonly hasMedicalConditions: boolean;
  readonly medicalNotes: string | null;
  readonly addressLine1: string;
  readonly addressLine2: string | null;
  readonly city: string;
  readonly state: string | null;
  readonly country: string;
  readonly postalCode: string | null;
  readonly emergencyContactName: string | null;
  readonly emergencyContactPhone: string | null;
  readonly status: string;
  readonly frozenUntil: string | null;
  readonly freezeReason: string | null;
  readonly totalCheckIns: number;
  readonly lastCheckInAt: string | null;
  readonly branchId: string | null;
  readonly photoUrl: string | null;
  readonly revealed: boolean;
  readonly joinedAt: string;
}

/** One progress record owned by a member. */
export interface ProgressEntry {
  readonly id: string;
  readonly kind: string;
  readonly label: string | null;
  readonly value: number | null;
  readonly unit: string | null;
  readonly notes: string | null;
  readonly recordedAt: string;
}

/** Current state of a consent key. */
export interface MemberConsent {
  readonly key: string;
  readonly version: string;
  readonly granted: boolean;
  readonly grantedAt: string;
  readonly withdrawnAt: string | null;
  readonly culture: string;
  readonly source: string;
}

/** Registered push device with a masked token preview. */
export interface MemberDevice {
  readonly id: string;
  readonly platform: string;
  readonly tokenPreview: string;
  readonly registeredAt: string;
}

/** Module-owned personal-data export. */
export interface MemberPrivacyExport {
  readonly exportedAt: string;
  readonly profile: MemberDetail;
  readonly progress: ProgressEntry[];
  readonly consents: MemberConsent[];
  readonly devices: MemberDevice[];
}

/** Outcome of a privacy erasure request. */
export interface ErasureResult {
  readonly memberId: string;
  readonly requestedAt: string;
  readonly confirmation: string;
}

/** Page of results returned by the API. */
export interface PagedResult<T> {
  readonly items: T[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly hasNext: boolean;
  readonly hasPrev: boolean;
}

/** Standard Kinevor response envelope. */
export interface ApiEnvelope<T> {
  readonly success: boolean;
  readonly data: T;
  readonly message?: string | null;
  readonly errors?: string[] | null;
}

/** Directory filters. */
export interface MemberListQuery {
  readonly search?: string;
  readonly status?: string;
  readonly page?: number;
  readonly pageSize?: number;
}

/** Consent captured during registration. */
export interface ConsentInput {
  readonly key: string;
  readonly version?: string | null;
  readonly granted: boolean;
}

/** Registration payload. */
export interface RegisterMemberRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string;
  readonly dateOfBirth: string;
  readonly gender: string;
  readonly weightKg?: number | null;
  readonly heightCm?: number | null;
  readonly medicalNotes?: string | null;
  readonly hasMedicalConditions: boolean;
  readonly addressLine1: string;
  readonly addressLine2?: string | null;
  readonly city: string;
  readonly state?: string | null;
  readonly country: string;
  readonly postalCode?: string | null;
  readonly emergencyContactName?: string | null;
  readonly emergencyContactPhone?: string | null;
  readonly photoUrl?: string | null;
  readonly consents?: ConsentInput[];
}

/** Profile update payload. */
export interface UpdateMemberRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly weightKg?: number | null;
  readonly heightCm?: number | null;
  readonly medicalNotes?: string | null;
  readonly hasMedicalConditions: boolean;
  readonly emergencyContactName?: string | null;
  readonly emergencyContactPhone?: string | null;
}

/** Freeze payload. */
export interface FreezeMemberRequest {
  readonly reason: string;
  readonly frozenUntil: string;
}

/** Progress creation payload. */
export interface AddProgressRequest {
  readonly kind: string;
  readonly label?: string | null;
  readonly value?: number | null;
  readonly unit?: string | null;
  readonly notes?: string | null;
  readonly recordedAt?: string | null;
}

/** Injector token for the members gateway. */
export const MEMBERS_GATEWAY = new InjectionToken<MembersGateway>('MembersGateway');

/** Base URL of the members API, for example `http://localhost:5083/api/v1`. */
export const MEMBERS_API_BASE_URL = new InjectionToken<string>('MEMBERS_API_BASE_URL');

/** HTTP contract consumed by the member facades. */
export interface MembersGateway {
  /** Lists members with search and status filters. */
  list(query: MemberListQuery): Promise<PagedResult<MemberSummary>>;
  /** Loads one member, optionally revealing sensitive fields. */
  byId(id: string, reveal: boolean): Promise<MemberDetail>;
  /** Registers a member and returns the new identifier. */
  register(request: RegisterMemberRequest): Promise<{ id: string }>;
  /** Updates a member profile. */
  update(id: string, request: UpdateMemberRequest): Promise<void>;
  /** Freezes a member until a date. */
  freeze(id: string, request: FreezeMemberRequest): Promise<void>;
  /** Returns a frozen member to active status. */
  unfreeze(id: string): Promise<void>;
  /** Returns the authenticated member's profile. */
  profile(): Promise<MemberDetail>;
  /** Updates the authenticated member's profile. */
  updateProfile(request: UpdateMemberRequest): Promise<void>;
  /** Lists the authenticated member's progress. */
  progress(): Promise<ProgressEntry[]>;
  /** Records a progress entry. */
  addProgress(request: AddProgressRequest): Promise<{ id: string }>;
  /** Lists consents for the authenticated member. */
  consents(): Promise<MemberConsent[]>;
  /** Grants a consent key. */
  grantConsent(key: string): Promise<void>;
  /** Withdraws a consent key. */
  withdrawConsent(key: string): Promise<void>;
  /** Lists registered devices. */
  devices(): Promise<MemberDevice[]>;
  /** Registers a push device token. */
  registerDevice(token: string, platform: string): Promise<{ id: string }>;
  /** Removes a push device token. */
  removeDevice(token: string): Promise<void>;
  /** Exports the authenticated member's data. */
  exportData(): Promise<MemberPrivacyExport>;
  /** Requests erasure of the authenticated member's data. */
  eraseData(): Promise<ErasureResult>;
}

/** Well-known consent keys used by the member module. */
export const CONSENT_KEYS = ['health_data', 'marketing', 'progress_photos', 'analytics'] as const;

/** Lifecycle statuses used for directory filters. */
export const MEMBER_STATUSES = ['Active', 'Frozen', 'Suspended', 'Expired'] as const;

/** Progress kinds accepted by the API. */
export const PROGRESS_KINDS = ['Weight', 'Measurement', 'PersonalRecord', 'Photo'] as const;
