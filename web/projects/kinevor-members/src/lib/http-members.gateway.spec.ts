import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { HttpMembersGateway } from './http-members.gateway';
import { MEMBERS_API_BASE_URL } from './member.model';

const member = {
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

const detail = {
  ...member,
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
  revealed: true,
  joinedAt: '2026-01-08T00:00:00Z',
};

describe('HttpMembersGateway', () => {
  let gateway: HttpMembersGateway;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        HttpMembersGateway,
        { provide: MEMBERS_API_BASE_URL, useValue: 'http://api.test/api/v1/' },
      ],
    });
    gateway = TestBed.inject(HttpMembersGateway);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps a paged member response with filters', async () => {
    const promise = gateway.list({ page: 2, pageSize: 10, search: 'maya', status: 'Active' });

    const request = http.expectOne(
      (req) => req.url === 'http://api.test/api/v1/members',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('10');
    expect(request.request.params.get('search')).toBe('maya');
    expect(request.request.params.get('status')).toBe('Active');
    request.flush({
      success: true,
      data: {
        items: [member],
        totalCount: 1,
        page: 2,
        pageSize: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: true,
      },
    });

    const page = await promise;
    expect(page.totalCount).toBe(1);
    expect(page.items[0].fullName).toBe('Maya Thompson');
  });

  it('requests a revealed member profile', async () => {
    const promise = gateway.byId(member.id, true);

    const request = http.expectOne(
      (req) => req.url === `http://api.test/api/v1/members/${member.id}`,
    );
    expect(request.request.params.get('reveal')).toBe('true');
    request.flush({ success: true, data: detail });

    expect((await promise).email).toBe('m***@kinevor.demo');
  });

  it('posts a freeze request', async () => {
    const promise = gateway.freeze(member.id, {
      reason: 'Travel',
      frozenUntil: '2026-12-01T00:00:00Z',
    });

    const request = http.expectOne(
      `http://api.test/api/v1/members/${member.id}/freeze`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body.reason).toBe('Travel');
    request.flush({ success: true, message: 'Member frozen.' });

    await promise;
  });

  it('calls the self-service consent endpoints', async () => {
    const grant = gateway.grantConsent('marketing');
    const grantRequest = http.expectOne(
      'http://api.test/api/v1/me/consents/marketing',
    );
    expect(grantRequest.request.method).toBe('POST');
    grantRequest.flush({ success: true });
    await grant;

    const withdraw = gateway.withdrawConsent('marketing');
    const withdrawRequest = http.expectOne(
      'http://api.test/api/v1/me/consents/marketing',
    );
    expect(withdrawRequest.request.method).toBe('DELETE');
    withdrawRequest.flush({ success: true });
    await withdraw;
  });
});
