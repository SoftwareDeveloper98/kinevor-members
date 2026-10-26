# @softwaredeveloper98/kinevor-members-web

Angular UI for the Kinevor Members module: the staff member directory, masked
profile detail with explicit reveal, registration, freeze/unfreeze lifecycle
actions, and the member self-service area for progress, consents, devices and
privacy export/erasure.

## GitHub Packages access

This package is private. Configure the scope and token before installing:

```ini
@softwaredeveloper98:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${KINEVOR_PACKAGES_TOKEN}
```

## Install

```bash
npm install @softwaredeveloper98/kinevor-members-web
```

The package expects Angular 21, Angular Material 21 and the Kinevor platform
web package.

## Provide the feature

```ts
import { provideHttpClient } from '@angular/common/http';
import { provideMembers } from '@softwaredeveloper98/kinevor-members-web';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideMembers({ apiBaseUrl: 'http://localhost:5083/api/v1' }),
    provideRouter([...MEMBERS_ROUTES]),
  ],
};
```

The host owns authentication. Every request must carry the member API's bearer
token (or the standalone demo's `X-Demo-Role` / `X-Demo-Member` headers).
`provideMembers` registers `HttpMembersGateway`, `MembersFacade` and
`MemberSelfServiceFacade`; supply a custom `MembersGateway` with the `gateway`
option for tests or alternative transports.

## Routes

| Route | Screen |
| --- | --- |
| `/members` | Searchable, filterable member directory |
| `/members/new` | Staff registration form with consent capture |
| `/members/:id` | Member profile, reveal, freeze and unfreeze |
| `/me` | Self-service profile, progress, consents, devices, privacy |

Import `MEMBERS_ROUTES` into the host router or mount the standalone
components directly.

## Privacy behaviour

- Directory summaries always mask e-mail and phone.
- Profile detail returns medical notes and emergency contact masked until
  `GET /members/{id}?reveal=true` is requested by an authorised staff user.
- Health data can only be registered with a `health_data` consent.
- The self-service privacy export contains only data owned by the Members
  module; erasure anonymizes the profile and purges progress and devices while
  retaining consent history as a legal record.

## Development

```bash
npm run install:local   # link the local platform package
npm test                # gateway and facade unit tests
npm run build:all       # build the library and demo
npm start               # demo on http://localhost:4202
```

The demo host lives in `projects/demo` and expects the Members API on
`http://localhost:5083`.
