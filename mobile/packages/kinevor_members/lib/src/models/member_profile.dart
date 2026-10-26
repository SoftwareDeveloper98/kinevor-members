/// Consent keys exposed by the members module.
const List<String> memberConsentKeys = [
  'health_data',
  'marketing',
  'progress_photos',
  'analytics',
];

/// Progress kinds accepted by the members API.
const List<String> memberProgressKinds = [
  'Weight',
  'Measurement',
  'PersonalRecord',
  'Photo',
];

/// Authenticated member's profile.
class MemberProfile {
  /// Creates a member profile.
  const MemberProfile({
    required this.id,
    required this.memberNumber,
    required this.firstName,
    required this.lastName,
    required this.fullName,
    required this.email,
    required this.phone,
    required this.dateOfBirth,
    required this.age,
    required this.gender,
    required this.hasMedicalConditions,
    required this.addressLine1,
    required this.city,
    required this.country,
    required this.status,
    required this.totalCheckIns,
    required this.revealed,
    required this.joinedAt,
    this.weightKg,
    this.heightCm,
    this.medicalNotes,
    this.addressLine2,
    this.state,
    this.postalCode,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.frozenUntil,
    this.freezeReason,
    this.lastCheckInAt,
    this.branchId,
    this.photoUrl,
  });

  /// Stable member identifier.
  final String id;

  /// Human-friendly member number.
  final String memberNumber;

  /// Legal first name.
  final String firstName;

  /// Legal last name.
  final String lastName;

  /// Combined display name.
  final String fullName;

  /// Contact e-mail address.
  final String email;

  /// Contact phone number.
  final String phone;

  /// Date of birth.
  final DateTime dateOfBirth;

  /// Age in whole years.
  final int age;

  /// Gender recorded at registration.
  final String gender;

  /// Body weight in kilograms.
  final double? weightKg;

  /// Height in centimetres.
  final double? heightCm;

  /// Whether the member disclosed a medical condition.
  final bool hasMedicalConditions;

  /// Medical notes, available to the member's self-service profile.
  final String? medicalNotes;

  /// First address line.
  final String addressLine1;

  /// Second address line.
  final String? addressLine2;

  /// City.
  final String city;

  /// State or region.
  final String? state;

  /// Country.
  final String country;

  /// Postal code.
  final String? postalCode;

  /// Emergency contact name.
  final String? emergencyContactName;

  /// Emergency contact phone number.
  final String? emergencyContactPhone;

  /// Lifecycle status, for example `Active` or `Frozen`.
  final String status;

  /// Date the freeze ends, when frozen.
  final DateTime? frozenUntil;

  /// Reason recorded for the freeze.
  final String? freezeReason;

  /// Lifetime check-in count.
  final int totalCheckIns;

  /// Most recent check-in timestamp.
  final DateTime? lastCheckInAt;

  /// Branch identifier, when assigned.
  final String? branchId;

  /// Optional profile photo URL.
  final String? photoUrl;

  /// Whether sensitive fields were revealed by the API.
  final bool revealed;

  /// Membership start date.
  final DateTime joinedAt;

  /// First letters of the first two name parts.
  String get initials {
    final parts = fullName
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty);
    if (parts.isEmpty) return '?';
    return parts.take(2).map((part) => part[0].toUpperCase()).join();
  }

  /// Single-line postal address.
  String get fullAddress => [
    addressLine1,
    if (addressLine2 != null && addressLine2!.isNotEmpty) addressLine2,
    city,
    if (state != null && state!.isNotEmpty) state,
    country,
  ].join(', ');

  /// Parses a defensive profile payload.
  factory MemberProfile.fromJson(Map<String, dynamic> json) {
    final first = json['firstName']?.toString() ?? '';
    final last = json['lastName']?.toString() ?? '';
    final full = json['fullName']?.toString() ?? '$first $last'.trim();
    return MemberProfile(
      id: json['id']?.toString() ?? '',
      memberNumber: json['memberNumber']?.toString() ?? '',
      firstName: first,
      lastName: last,
      fullName: full,
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      dateOfBirth:
          DateTime.tryParse(json['dateOfBirth']?.toString() ?? '') ??
          DateTime(1970),
      age: (json['age'] as num?)?.toInt() ?? 0,
      gender: json['gender']?.toString() ?? '',
      weightKg: (json['weightKg'] as num?)?.toDouble(),
      heightCm: (json['heightCm'] as num?)?.toDouble(),
      hasMedicalConditions: json['hasMedicalConditions'] == true,
      medicalNotes: json['medicalNotes']?.toString(),
      addressLine1: json['addressLine1']?.toString() ?? '',
      addressLine2: json['addressLine2']?.toString(),
      city: json['city']?.toString() ?? '',
      state: json['state']?.toString(),
      country: json['country']?.toString() ?? '',
      postalCode: json['postalCode']?.toString(),
      emergencyContactName: json['emergencyContactName']?.toString(),
      emergencyContactPhone: json['emergencyContactPhone']?.toString(),
      status: json['status']?.toString() ?? 'Active',
      frozenUntil: DateTime.tryParse(json['frozenUntil']?.toString() ?? ''),
      freezeReason: json['freezeReason']?.toString(),
      totalCheckIns: (json['totalCheckIns'] as num?)?.toInt() ?? 0,
      lastCheckInAt: DateTime.tryParse(json['lastCheckInAt']?.toString() ?? ''),
      branchId: json['branchId']?.toString(),
      photoUrl: json['photoUrl']?.toString(),
      revealed: json['revealed'] == true,
      joinedAt:
          DateTime.tryParse(json['joinedAt']?.toString() ?? '') ??
          DateTime(1970),
    );
  }
}

/// One progress record owned by the member.
class ProgressEntry {
  /// Creates a progress entry.
  const ProgressEntry({
    required this.id,
    required this.kind,
    required this.recordedAt,
    this.label,
    this.value,
    this.unit,
    this.notes,
  });

  /// Stable progress identifier.
  final String id;

  /// Progress kind, for example `Weight` or `PersonalRecord`.
  final String kind;

  /// Optional custom label.
  final String? label;

  /// Measured value, when numeric.
  final double? value;

  /// Unit for [value], for example `kg`.
  final String? unit;

  /// Optional notes.
  final String? notes;

  /// When the entry was recorded.
  final DateTime recordedAt;

  /// Parses a defensive progress payload.
  factory ProgressEntry.fromJson(Map<String, dynamic> json) => ProgressEntry(
    id: json['id']?.toString() ?? '',
    kind: json['kind']?.toString() ?? '',
    label: json['label']?.toString(),
    value: (json['value'] as num?)?.toDouble(),
    unit: json['unit']?.toString(),
    notes: json['notes']?.toString(),
    recordedAt:
        DateTime.tryParse(json['recordedAt']?.toString() ?? '') ??
        DateTime(1970),
  );
}

/// Current state of one consent key.
class MemberConsent {
  /// Creates a consent record.
  const MemberConsent({
    required this.key,
    required this.version,
    required this.granted,
    required this.grantedAt,
    required this.culture,
    required this.source,
    this.withdrawnAt,
  });

  /// Stable consent key.
  final String key;

  /// Consent text version accepted by the member.
  final String version;

  /// Whether the consent is currently granted.
  final bool granted;

  /// When the consent was last granted.
  final DateTime grantedAt;

  /// When the consent was withdrawn, when applicable.
  final DateTime? withdrawnAt;

  /// Culture used when the consent was accepted.
  final String culture;

  /// Source that captured the consent.
  final String source;

  /// Parses a defensive consent payload.
  factory MemberConsent.fromJson(Map<String, dynamic> json) => MemberConsent(
    key: json['key']?.toString() ?? '',
    version: json['version']?.toString() ?? '',
    granted: json['granted'] == true,
    grantedAt:
        DateTime.tryParse(json['grantedAt']?.toString() ?? '') ??
        DateTime(1970),
    withdrawnAt: DateTime.tryParse(json['withdrawnAt']?.toString() ?? ''),
    culture: json['culture']?.toString() ?? 'en',
    source: json['source']?.toString() ?? '',
  );
}

/// Registered push device with a masked token preview.
class MemberDevice {
  /// Creates a device projection.
  const MemberDevice({
    required this.id,
    required this.platform,
    required this.tokenPreview,
    required this.registeredAt,
  });

  /// Stable device identifier.
  final String id;

  /// Platform name, for example `ios` or `android`.
  final String platform;

  /// Masked token preview.
  final String tokenPreview;

  /// When the device was registered.
  final DateTime registeredAt;

  /// Parses a defensive device payload.
  factory MemberDevice.fromJson(Map<String, dynamic> json) => MemberDevice(
    id: json['id']?.toString() ?? '',
    platform: json['platform']?.toString() ?? '',
    tokenPreview: json['tokenPreview']?.toString() ?? '',
    registeredAt:
        DateTime.tryParse(json['registeredAt']?.toString() ?? '') ??
        DateTime(1970),
  );
}

/// Member-owned data exported by the module.
class MemberPrivacyExport {
  /// Creates a privacy export.
  const MemberPrivacyExport({
    required this.exportedAt,
    required this.profile,
    required this.progress,
    required this.consents,
    required this.devices,
  });

  /// When the export was generated.
  final DateTime exportedAt;

  /// Exported profile.
  final MemberProfile profile;

  /// Exported progress entries.
  final List<ProgressEntry> progress;

  /// Exported consent records.
  final List<MemberConsent> consents;

  /// Exported device projections.
  final List<MemberDevice> devices;

  /// Parses a defensive export payload.
  factory MemberPrivacyExport.fromJson(Map<String, dynamic> json) {
    final rawProfile = json['profile'];
    return MemberPrivacyExport(
      exportedAt:
          DateTime.tryParse(json['exportedAt']?.toString() ?? '') ??
          DateTime(1970),
      profile: rawProfile is Map
          ? MemberProfile.fromJson(Map<String, dynamic>.from(rawProfile))
          : MemberProfile(
              id: '',
              memberNumber: '',
              firstName: '',
              lastName: '',
              fullName: '',
              email: '',
              phone: '',
              dateOfBirth: DateTime(1970),
              age: 0,
              gender: '',
              hasMedicalConditions: false,
              addressLine1: '',
              city: '',
              country: '',
              status: '',
              totalCheckIns: 0,
              revealed: false,
              joinedAt: DateTime(1970),
            ),
      progress: _list(json['progress'], ProgressEntry.fromJson),
      consents: _list(json['consents'], MemberConsent.fromJson),
      devices: _list(json['devices'], MemberDevice.fromJson),
    );
  }
}

/// Outcome of a privacy erasure request.
class ErasureResult {
  /// Creates an erasure result.
  const ErasureResult({
    required this.memberId,
    required this.requestedAt,
    required this.confirmation,
  });

  /// Erased member identifier.
  final String memberId;

  /// When erasure was processed.
  final DateTime requestedAt;

  /// Human-readable confirmation.
  final String confirmation;

  /// Parses a defensive erasure payload.
  factory ErasureResult.fromJson(Map<String, dynamic> json) => ErasureResult(
    memberId: json['memberId']?.toString() ?? '',
    requestedAt:
        DateTime.tryParse(json['requestedAt']?.toString() ?? '') ??
        DateTime(1970),
    confirmation: json['confirmation']?.toString() ?? '',
  );
}

List<T> _list<T>(Object? value, T Function(Map<String, dynamic>) parse) {
  if (value is! List) return const [];
  return [
    for (final item in value)
      if (item is Map) parse(Map<String, dynamic>.from(item)),
  ];
}
