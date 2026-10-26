# kinevor_members

Flutter member self-service UI and API client for Kinevor.

## Features

- `MemberProfileScreen` with the member hero, lifecycle status, check-in and
  consent stats, progress timeline, progress composer and contact facts.
- `MemberPrivacyScreen` with health, marketing, photo and analytics consent
  switches, registered devices, JSON export and erasure confirmation.
- Typed `KinevorMembersClient`, `MembersRepository` and
  `RemoteMembersRepository`.
- Kinevor dark theme, Sora typography and configurable strings.
- Injectable repository for tests and non-Kinevor hosts.

## Install

```yaml
dependencies:
  kinevor_members:
    git:
      url: https://github.com/SoftwareDeveloper98/kinevor-members.git
      path: mobile/packages/kinevor_members
      ref: v0.1.0
```

## Use

```dart
import 'package:flutter/material.dart';
import 'package:kinevor_members/kinevor_members.dart';

final repository = RemoteMembersRepository(
  KinevorMembersClient(
    baseUrl: Uri.parse('https://api.example.com/api/v1'),
    headers: {'Authorization': 'Bearer $accessToken'},
  ),
);

runApp(MaterialApp(
  theme: KinevorMembersTheme.dark(),
  home: MemberProfileScreen(repository: repository),
));
```

The package does not authenticate the member. Supply an `http.Client` or headers
from the host's authentication stack. The demo host uses the API's
development-only `X-Demo-Role` and `X-Demo-Member` trust headers.

## Screens

```dart
MemberProfileScreen(repository: repository)
MemberPrivacyScreen(repository: repository)
```

The profile app bar opens the privacy screen. Both screens expose configurable
`MembersStrings` for localization.

## Example

```powershell
cd example
flutter pub get
flutter run -d windows
flutter run -d chrome --dart-define=KINEVOR_API_BASE_URL=http://localhost:5083/api/v1
```

The demo targets Maya Thompson's seeded profile. On an Android emulator use
`http://10.0.2.2:5083/api/v1`.

## Test

```powershell
flutter pub get
flutter analyze
flutter test
flutter test --update-goldens test\members_golden_test.dart
```

Golden images live in `test/goldens` and are published as README screenshots.

## License

MIT
