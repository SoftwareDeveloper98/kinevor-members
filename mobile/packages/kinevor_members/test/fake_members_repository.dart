import 'package:kinevor_members/kinevor_members.dart';

class FakeMembersRepository implements MembersRepository {
  FakeMembersRepository({this.failure});

  final Object? failure;
  int profileCalls = 0;
  int progressCalls = 0;
  int consentCalls = 0;
  int deviceCalls = 0;
  int addProgressCalls = 0;
  int grantCalls = 0;
  int withdrawCalls = 0;
  int exportCalls = 0;
  int eraseCalls = 0;
  String? lastKind;
  String? lastLabel;
  double? lastValue;
  String? lastUnit;

  final List<ProgressEntry> _progress = [...sampleProgress];
  final List<MemberConsent> _consents = [...sampleConsents];

  void _check() {
    if (failure != null) throw failure!;
  }

  @override
  Future<MemberProfile> getProfile() async {
    profileCalls++;
    _check();
    return sampleProfile;
  }

  @override
  Future<List<ProgressEntry>> getProgress() async {
    progressCalls++;
    _check();
    return [..._progress];
  }

  @override
  Future<List<MemberConsent>> getConsents() async {
    consentCalls++;
    _check();
    return [..._consents];
  }

  @override
  Future<List<MemberDevice>> getDevices() async {
    deviceCalls++;
    _check();
    return sampleDevices;
  }

  @override
  Future<void> addProgress({
    required String kind,
    String? label,
    double? value,
    String? unit,
    String? notes,
  }) async {
    addProgressCalls++;
    _check();
    lastKind = kind;
    lastLabel = label;
    lastValue = value;
    lastUnit = unit;
    _progress.insert(
      0,
      ProgressEntry(
        id: 'progress-new',
        kind: kind,
        label: label,
        value: value,
        unit: unit,
        notes: notes,
        recordedAt: DateTime(2026, 10, 20),
      ),
    );
  }

  @override
  Future<void> grantConsent(String key) async {
    grantCalls++;
    _check();
    _updateConsent(key, true);
  }

  @override
  Future<void> withdrawConsent(String key) async {
    withdrawCalls++;
    _check();
    _updateConsent(key, false);
  }

  void _updateConsent(String key, bool granted) {
    final index = _consents.indexWhere((consent) => consent.key == key);
    final updated = MemberConsent(
      key: key,
      version: '2026-10',
      granted: granted,
      grantedAt: DateTime(2026, 10, 20),
      withdrawnAt: granted ? null : DateTime(2026, 10, 20),
      culture: 'en',
      source: 'test',
    );
    if (index >= 0) {
      _consents[index] = updated;
    } else {
      _consents.add(updated);
    }
  }

  @override
  Future<MemberPrivacyExport> exportData() async {
    exportCalls++;
    _check();
    return MemberPrivacyExport(
      exportedAt: DateTime(2026, 10, 20),
      profile: sampleProfile,
      progress: [..._progress],
      consents: [..._consents],
      devices: sampleDevices,
    );
  }

  @override
  Future<ErasureResult> eraseData() async {
    eraseCalls++;
    _check();
    return ErasureResult(
      memberId: sampleProfile.id,
      requestedAt: DateTime(2026, 10, 20),
      confirmation: 'Your erasure request was processed.',
    );
  }
}

final sampleProfile = MemberProfile(
  id: '11111111-1111-1111-1111-111111111111',
  memberNumber: 'KZN-2026-00001',
  firstName: 'Maya',
  lastName: 'Thompson',
  fullName: 'Maya Thompson',
  email: 'maya.thompson@kinevor.demo',
  phone: '+447700900111',
  dateOfBirth: DateTime(1994, 4, 12),
  age: 32,
  gender: 'Female',
  weightKg: 68.4,
  heightCm: 168,
  hasMedicalConditions: false,
  addressLine1: '14 Camden High Street',
  addressLine2: 'Flat 3',
  city: 'London',
  state: 'Greater London',
  country: 'United Kingdom',
  postalCode: 'NW1 0JH',
  emergencyContactName: 'Ethan Thompson',
  emergencyContactPhone: '+447700900112',
  status: 'Active',
  totalCheckIns: 42,
  lastCheckInAt: DateTime(2026, 10, 18),
  revealed: true,
  joinedAt: DateTime(2025, 12, 20),
);

final sampleProgress = [
  ProgressEntry(
    id: 'progress-1',
    kind: 'Weight',
    value: 67.6,
    unit: 'kg',
    notes: 'Down 0.8 kg this month.',
    recordedAt: DateTime(2026, 10, 19),
  ),
  ProgressEntry(
    id: 'progress-2',
    kind: 'PersonalRecord',
    label: 'Back squat',
    value: 95,
    unit: 'kg',
    notes: 'Three clean reps.',
    recordedAt: DateTime(2026, 10, 13),
  ),
  ProgressEntry(
    id: 'progress-3',
    kind: 'Measurement',
    label: 'Waist',
    value: 74.5,
    unit: 'cm',
    notes: 'Relaxed measurement.',
    recordedAt: DateTime(2026, 10, 6),
  ),
  ProgressEntry(
    id: 'progress-4',
    kind: 'Weight',
    value: 68.4,
    unit: 'kg',
    notes: 'Morning weigh-in.',
    recordedAt: DateTime(2026, 9, 29),
  ),
];

final sampleConsents = [
  MemberConsent(
    key: 'health_data',
    version: '2026-10',
    granted: true,
    grantedAt: DateTime(2026, 7, 22),
    culture: 'en',
    source: 'demo',
  ),
  MemberConsent(
    key: 'marketing',
    version: '2026-10',
    granted: true,
    grantedAt: DateTime(2026, 7, 22),
    culture: 'en',
    source: 'demo',
  ),
  MemberConsent(
    key: 'analytics',
    version: '2026-10',
    granted: true,
    grantedAt: DateTime(2026, 7, 22),
    culture: 'en',
    source: 'demo',
  ),
];

final sampleDevices = [
  MemberDevice(
    id: 'device-1',
    platform: 'ios',
    tokenPreview: 'demo-i...0001',
    registeredAt: DateTime(2026, 7, 22),
  ),
];
