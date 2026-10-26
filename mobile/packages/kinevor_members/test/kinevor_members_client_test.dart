import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:kinevor_members/kinevor_members.dart';

Map<String, dynamic> profileJson() => {
  'id': 'member-1',
  'memberNumber': 'KZN-2026-00001',
  'firstName': 'Maya',
  'lastName': 'Thompson',
  'fullName': 'Maya Thompson',
  'email': 'maya.thompson@kinevor.demo',
  'phone': '+447700900111',
  'dateOfBirth': '1994-04-12T00:00:00',
  'age': 32,
  'gender': 'Female',
  'weightKg': 68.4,
  'heightCm': 168,
  'hasMedicalConditions': false,
  'medicalNotes': null,
  'addressLine1': '14 Camden High Street',
  'addressLine2': 'Flat 3',
  'city': 'London',
  'state': 'Greater London',
  'country': 'United Kingdom',
  'postalCode': 'NW1 0JH',
  'emergencyContactName': 'Ethan Thompson',
  'emergencyContactPhone': '+447700900112',
  'status': 'Active',
  'frozenUntil': null,
  'freezeReason': null,
  'totalCheckIns': 42,
  'lastCheckInAt': '2026-10-18T12:38:18',
  'branchId': null,
  'photoUrl': null,
  'revealed': true,
  'joinedAt': '2025-12-20T12:38:18',
};

http.Response envelope(Object? data, {int status = 200}) => http.Response(
  jsonEncode({'success': true, 'data': data}),
  status,
  headers: {'content-type': 'application/json'},
);

void main() {
  test('profile request sends demo headers and parses the member', () async {
    late http.Request captured;
    final client = KinevorMembersClient(
      baseUrl: Uri.parse('http://localhost:5083/api/v1/'),
      headers: const {'X-Demo-Role': 'Member'},
      httpClient: MockClient((request) async {
        captured = request;
        return envelope(profileJson());
      }),
    );

    final profile = await client.fetchProfile();

    expect(captured.method, 'GET');
    expect(captured.url.toString(), 'http://localhost:5083/api/v1/me/profile');
    expect(captured.headers['X-Demo-Role'], 'Member');
    expect(profile.fullName, 'Maya Thompson');
    expect(profile.initials, 'MT');
    expect(profile.totalCheckIns, 42);
    expect(profile.fullAddress, contains('14 Camden High Street'));
  });

  test('progress, consents and devices parse list envelopes', () async {
    final client = KinevorMembersClient(
      baseUrl: Uri.parse('http://localhost:5083/api/v1'),
      httpClient: MockClient((request) async {
        if (request.url.path.endsWith('/progress')) {
          return envelope([
            {
              'id': 'progress-1',
              'kind': 'Weight',
              'value': 67.6,
              'unit': 'kg',
              'notes': 'Down 0.8 kg.',
              'recordedAt': '2026-10-19T12:00:00',
            },
          ]);
        }
        if (request.url.path.endsWith('/consents')) {
          return envelope([
            {
              'key': 'health_data',
              'version': '2026-10',
              'granted': true,
              'grantedAt': '2026-07-22T12:00:00',
              'withdrawnAt': null,
              'culture': 'en',
              'source': 'demo',
            },
          ]);
        }
        return envelope([
          {
            'id': 'device-1',
            'platform': 'ios',
            'tokenPreview': 'demo-i...0001',
            'registeredAt': '2026-07-22T12:00:00',
          },
        ]);
      }),
    );

    final progress = await client.fetchProgress();
    final consents = await client.fetchConsents();
    final devices = await client.fetchDevices();

    expect(progress.single.kind, 'Weight');
    expect(progress.single.value, 67.6);
    expect(consents.single.granted, isTrue);
    expect(devices.single.platform, 'ios');
  });

  test('progress, consent and device mutations use the right verbs', () async {
    final requests = <http.Request>[];
    final client = KinevorMembersClient(
      baseUrl: Uri.parse('http://localhost:5083/api/v1'),
      httpClient: MockClient((request) async {
        requests.add(request);
        return envelope({'id': 'created'});
      }),
    );

    await client.addProgress(
      kind: 'Measurement',
      label: 'Waist',
      value: 74.5,
      unit: 'cm',
      notes: 'Relaxed',
    );
    await client.grantConsent('marketing');
    await client.withdrawConsent('analytics');

    expect(requests[0].method, 'POST');
    expect(requests[0].url.path, '/api/v1/me/progress');
    expect(jsonDecode(requests[0].body), {
      'kind': 'Measurement',
      'label': 'Waist',
      'value': 74.5,
      'unit': 'cm',
      'notes': 'Relaxed',
    });
    expect(requests[1].method, 'POST');
    expect(requests[1].url.path, '/api/v1/me/consents/marketing');
    expect(requests[2].method, 'DELETE');
    expect(requests[2].url.path, '/api/v1/me/consents/analytics');
  });

  test('export and erasure parse their nested payloads', () async {
    final client = KinevorMembersClient(
      baseUrl: Uri.parse('http://localhost:5083/api/v1'),
      httpClient: MockClient((request) async {
        if (request.url.path.endsWith('/export')) {
          return envelope({
            'exportedAt': '2026-10-20T12:00:00',
            'profile': profileJson(),
            'progress': <Object?>[],
            'consents': <Object?>[],
            'devices': <Object?>[],
          });
        }
        return envelope({
          'memberId': 'member-1',
          'requestedAt': '2026-10-20T12:05:00',
          'confirmation': 'Your erasure request was processed.',
        });
      }),
    );

    final export = await client.exportData();
    final erased = await client.eraseData();

    expect(export.profile.memberNumber, 'KZN-2026-00001');
    expect(export.progress, isEmpty);
    expect(erased.memberId, 'member-1');
    expect(erased.confirmation, contains('processed'));
  });

  test('failed requests surface the API message', () async {
    final client = KinevorMembersClient(
      baseUrl: Uri.parse('http://localhost:5083/api/v1'),
      httpClient: MockClient(
        (_) async => http.Response(
          jsonEncode({
            'success': false,
            'message': 'No linked member profile.',
          }),
          403,
        ),
      ),
    );

    await expectLater(
      client.fetchProfile(),
      throwsA(
        isA<MembersApiException>()
            .having((error) => error.statusCode, 'status', 403)
            .having(
              (error) => error.message,
              'message',
              'No linked member profile.',
            ),
      ),
    );
  });

  test('network failures are wrapped', () async {
    final client = KinevorMembersClient(
      baseUrl: Uri.parse('http://localhost:5083/api/v1'),
      httpClient: MockClient((_) async => throw Exception('offline')),
    );

    await expectLater(
      client.fetchProfile(),
      throwsA(isA<MembersApiException>()),
    );
  });
}
