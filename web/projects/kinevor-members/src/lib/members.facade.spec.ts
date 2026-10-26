import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  MemberConsent,
  MemberDetail,
  MemberDevice,
  MEMBERS_GATEWAY,
  MembersGateway,
  MemberSummary,
  PagedResult,
  ProgressEntry,
} from './member.model';
import { MembersFacade } from './members.facade';
import { MemberSelfServiceFacade } from './member-self-service.facade';

const summary: MemberSummary = {
  id: '11111111-1111-1111-1111-111111111111',
  memberNumber: 'KZN-2026-00001',
  fullName: 'Maya Thompson',
  email: 'm***@kinevor.demo',
  phone: '***0111',
  gender: 'Female',
  age: 32,
  status: 'Active',
  photoUrl: null,
  joinedAt: '2026-01-08T00:00:00Z',
};

const detail: MemberDetail = {
  ...summary,
  firstName: 'Maya',
  lastName: 'Thompson',
  dateOfBirth: '1994-04-12T00:00:00Z',
  weightKg: 68.4,
  heightCm: 168,
  hasMedicalConditions: false,
  medicalNotes: null,
  addressLine1: '14 Camden High Street',
  addressLine2: 'Flat 3',
  city: 'London',
  state: 'Greater London',
  country: 'United Kingdom',
  postalCode: 'NW1 0JH',
  emergencyContactName: 'Ethan Thompson',
  emergencyContactPhone: '+447700900112',
  frozenUntil: null,
  freezeReason: null,
  totalCheckIns: 42,
  lastCheckInAt: '2026-10-18T08:30:00Z',
  branchId: null,
  revealed: false,
  joinedAt: '2026-01-08T00:00:00Z',
};

const progress: ProgressEntry = {
  id: 'p1',
  kind: 'Weight',
  label: null,
  value: 67.6,
  unit: 'kg',
  notes: 'Down 0.8 kg this month.',
  recordedAt: '2026-10-19T07:00:00Z',
};

const consent: MemberConsent = {
  key: 'health_data',
  version: '2026-10',
  granted: true,
  grantedAt: '2026-07-22T00:00:00Z',
  withdrawnAt: null,
  culture: 'en',
  source: 'demo',
};

const device: MemberDevice = {
  id: 'd1',
  platform: 'ios',
  tokenPreview: 'demo-i...0001',
  registeredAt: '2026-09-01T00:00:00Z',
};

const page: PagedResult<MemberSummary> = {
  items: [summary],
  totalCount: 5,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

function gatewayMock(): MembersGateway {
  return {
    list: vi.fn(async () => page),
    byId: vi.fn(async (_id: string, reveal: boolean) => ({ ...detail, revealed: reveal })),
    register: vi.fn(async () => ({ id: summary.id })),
    update: vi.fn(async () => undefined),
    freeze: vi.fn(async () => undefined),
    unfreeze: vi.fn(async () => undefined),
    profile: vi.fn(async () => ({ ...detail, revealed: true })),
    updateProfile: vi.fn(async () => undefined),
    progress: vi.fn(async () => [progress]),
    addProgress: vi.fn(async () => ({ id: 'p2' })),
    consents: vi.fn(async () => [consent]),
    grantConsent: vi.fn(async () => undefined),
    withdrawConsent: vi.fn(async () => undefined),
    devices: vi.fn(async () => [device]),
    registerDevice: vi.fn(async () => ({ id: 'd2' })),
    removeDevice: vi.fn(async () => undefined),
    exportData: vi.fn(async () => ({
      exportedAt: '2026-10-20T00:00:00Z',
      profile: { ...detail, revealed: true },
      progress: [progress],
      consents: [consent],
      devices: [device],
    })),
    eraseData: vi.fn(async () => ({
      memberId: summary.id,
      requestedAt: '2026-10-20T00:00:00Z',
      confirmation: 'Erased.',
    })),
  };
}

function setup() {
  const gateway = gatewayMock();
  TestBed.configureTestingModule({
    providers: [
      MembersFacade,
      MemberSelfServiceFacade,
      { provide: MEMBERS_GATEWAY, useValue: gateway },
    ],
  });

  return {
    gateway,
    facade: TestBed.inject(MembersFacade),
    self: TestBed.inject(MemberSelfServiceFacade),
  };
}

describe('MembersFacade', () => {
  it('loads the directory and computed stats', async () => {
    const { facade, gateway } = setup();

    await facade.load();

    expect(gateway.list).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(facade.members()).toEqual([summary]);
    expect(facade.total()).toBe(5);
    expect(facade.activeCount()).toBe(1);
    expect(facade.averageAge()).toBe(32);
    expect(facade.loading()).toBe(false);
  });

  it('merges directory filters and reloads', async () => {
    const { facade, gateway } = setup();

    await facade.updateQuery({ page: 2, search: 'maya', status: 'Active' });

    expect(facade.query()).toEqual({ page: 2, pageSize: 20, search: 'maya', status: 'Active' });
    expect(gateway.list).toHaveBeenCalledWith({
      page: 2,
      pageSize: 20,
      search: 'maya',
      status: 'Active',
    });
  });

  it('loads a masked detail and reveals it on demand', async () => {
    const { facade, gateway } = setup();

    await facade.loadDetail(summary.id);
    expect(facade.detail()?.revealed).toBe(false);
    expect(gateway.byId).toHaveBeenCalledWith(summary.id, false);

    await facade.reveal();
    expect(facade.detail()?.revealed).toBe(true);
    expect(gateway.byId).toHaveBeenCalledWith(summary.id, true);
  });

  it('freezes the selected member and refreshes detail state', async () => {
    const { facade, gateway } = setup();
    await facade.loadDetail(summary.id);

    const frozen = await facade.freeze({
      reason: 'Travel',
      frozenUntil: '2026-12-01T00:00:00Z',
    });

    expect(frozen).toBe(true);
    expect(gateway.freeze).toHaveBeenCalledWith(summary.id, {
      reason: 'Travel',
      frozenUntil: '2026-12-01T00:00:00Z',
    });
    expect(gateway.byId).toHaveBeenLastCalledWith(summary.id, false);
    expect(facade.actionLoading()).toBe(false);
  });

  it('surfaces API failures as an error message', async () => {
    const { facade, gateway } = setup();
    gateway.list = vi.fn(async () => {
      throw new Error('offline');
    });

    await facade.load();

    expect(facade.error()).toBe('The request failed. Try again.');
    expect(facade.loading()).toBe(false);
  });
});

describe('MemberSelfServiceFacade', () => {
  it('loads profile, progress, consents and devices together', async () => {
    const { self, gateway } = setup();

    await self.load();

    expect(gateway.profile).toHaveBeenCalled();
    expect(self.profile()?.fullName).toBe('Maya Thompson');
    expect(self.progress()).toEqual([progress]);
    expect(self.consents()).toEqual([consent]);
    expect(self.devices()).toEqual([device]);
    expect(self.grantedConsents()).toBe(1);
    expect(self.latestProgress()?.value).toBe(67.6);
  });

  it('grants a consent and refreshes the consent list', async () => {
    const { self, gateway } = setup();
    await self.load();
    gateway.consents = vi.fn(async () => [consent, { ...consent, key: 'marketing' }]);

    await self.grantConsent('marketing');

    expect(gateway.grantConsent).toHaveBeenCalledWith('marketing');
    expect(self.consents()).toHaveLength(2);
  });

  it('records progress and reloads the timeline', async () => {
    const { self, gateway } = setup();
    await self.load();
    const next = { ...progress, id: 'p2', value: 67.1 };
    gateway.progress = vi.fn(async () => [next, progress]);

    const added = await self.addProgress({ kind: 'Weight', value: 67.1, unit: 'kg' });

    expect(added).toBe(true);
    expect(gateway.addProgress).toHaveBeenCalledWith({
      kind: 'Weight',
      value: 67.1,
      unit: 'kg',
    });
    expect(self.progress()[0].id).toBe('p2');
  });
});
