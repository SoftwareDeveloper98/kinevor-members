import { EnvironmentProviders, Provider, Type, makeEnvironmentProviders } from '@angular/core';
import { HttpMembersGateway } from './http-members.gateway';
import { MEMBERS_API_BASE_URL, MEMBERS_GATEWAY, MembersGateway } from './member.model';
import { MembersFacade } from './members.facade';
import { MemberSelfServiceFacade } from './member-self-service.facade';

/** Configuration accepted by {@link provideMembers}. */
export interface MembersOptions {
  /** Base URL of the members API, including `/api/v1`. */
  readonly apiBaseUrl?: string;
  /** Alternative gateway implementation; defaults to {@link HttpMembersGateway}. */
  readonly gateway?: Type<MembersGateway>;
}

/**
 * Registers the members gateway and facades.
 *
 * The host application must provide `HttpClient` when the default gateway is used.
 *
 * @param options - API base URL and gateway override.
 * @returns Providers for the members feature.
 */
export function provideMembers(options: MembersOptions = {}): EnvironmentProviders {
  const providers: (Provider | EnvironmentProviders)[] = [
    { provide: MEMBERS_GATEWAY, useClass: options.gateway ?? HttpMembersGateway },
    MembersFacade,
    MemberSelfServiceFacade,
  ];

  if (options.apiBaseUrl) {
    providers.push({ provide: MEMBERS_API_BASE_URL, useValue: options.apiBaseUrl });
  }

  return makeEnvironmentProviders(providers);
}
