/// User-facing labels used by the members widgets.
class MembersStrings {
  /// Creates a label bundle.
  const MembersStrings({
    this.brand = 'Kinevor Members',
    this.title = 'My membership',
    this.profileEyebrow = 'MEMBER PROFILE',
    this.checkIns = 'Check-ins',
    this.age = 'Age',
    this.weight = 'Weight',
    this.consents = 'Consents',
    this.progressTitle = 'Progress timeline',
    this.logProgress = 'Log progress',
    this.kind = 'Kind',
    this.labelOptional = 'Label (optional)',
    this.value = 'Value',
    this.unit = 'Unit',
    this.notesOptional = 'Notes (optional)',
    this.addEntry = 'Add entry',
    this.cancel = 'Cancel',
    this.noProgress = 'No progress recorded yet.',
    this.contactTitle = 'Contact & emergency',
    this.dateOfBirth = 'Date of birth',
    this.address = 'Address',
    this.emergencyContact = 'Emergency contact',
    this.emergencyPhone = 'Emergency phone',
    this.medicalNotes = 'Medical notes',
    this.noneRecorded = 'None recorded',
    this.privacyTitle = 'Privacy & devices',
    this.privacyEyebrow = 'PRIVACY CENTRE',
    this.managePrivacy = 'Manage privacy and devices',
    this.consentsTitle = 'Consents',
    this.consentNote = 'Version 2026-10. You can withdraw at any time.',
    this.devicesTitle = 'Devices',
    this.noDevices = 'No push devices registered.',
    this.privacyRightsTitle = 'Your privacy rights',
    this.privacyRightsBody =
        'Export everything this module stores, or request erasure. Consent history is retained as a legal record.',
    this.exportData = 'Export my data',
    this.exportTitle = 'Your data export',
    this.exportSummary =
        'The export contains your profile, progress, consent and device records owned by the Members module.',
    this.exportReady = 'Data export ready.',
    this.close = 'Close',
    this.eraseData = 'Request erasure',
    this.eraseTitle = 'Erase your data?',
    this.eraseBody =
        'Your profile, health data, progress and devices will be removed. This cannot be undone. Consent history is retained as a legal record.',
    this.eraseConfirm = 'Erase my data',
    this.eraseSuccess = 'Erasure request processed.',
    this.loadError = 'Could not load your member data.',
    this.retry = 'Try again',
    this.lastCheckIn = 'Last check-in',
    this.joined = 'Member since',
    this.frozenUntil = 'Frozen until',
    this.frozenReason = 'Freeze reason',
    this.unknown = 'Unknown',
    this.actionFailed = 'The request could not be completed.',
    this.added = 'Progress entry recorded.',
    this.consentGranted = 'Consent granted.',
    this.consentWithdrawn = 'Consent withdrawn.',
    this.medicalConsentRequired =
        'Enable health data consent before logging health details.',
  });

  /// Small brand label.
  final String brand;

  /// Profile screen title.
  final String title;

  /// Eyebrow above the profile name.
  final String profileEyebrow;

  /// Check-in stat label.
  final String checkIns;

  /// Age stat label.
  final String age;

  /// Weight stat label.
  final String weight;

  /// Consent stat label.
  final String consents;

  /// Progress card title.
  final String progressTitle;

  /// Progress action label.
  final String logProgress;

  /// Progress kind field label.
  final String kind;

  /// Optional label field.
  final String labelOptional;

  /// Progress value field.
  final String value;

  /// Progress unit field.
  final String unit;

  /// Optional notes field.
  final String notesOptional;

  /// Add-progress action.
  final String addEntry;

  /// Cancel action.
  final String cancel;

  /// Empty progress message.
  final String noProgress;

  /// Contact card title.
  final String contactTitle;

  /// Date-of-birth label.
  final String dateOfBirth;

  /// Address label.
  final String address;

  /// Emergency contact label.
  final String emergencyContact;

  /// Emergency phone label.
  final String emergencyPhone;

  /// Medical notes label.
  final String medicalNotes;

  /// Empty value label.
  final String noneRecorded;

  /// Privacy screen title.
  final String privacyTitle;

  /// Privacy eyebrow.
  final String privacyEyebrow;

  /// Privacy navigation label.
  final String managePrivacy;

  /// Consent section title.
  final String consentsTitle;

  /// Consent version note.
  final String consentNote;

  /// Device section title.
  final String devicesTitle;

  /// Empty device message.
  final String noDevices;

  /// Privacy rights title.
  final String privacyRightsTitle;

  /// Privacy rights description.
  final String privacyRightsBody;

  /// Export action.
  final String exportData;

  /// Export dialog title.
  final String exportTitle;

  /// Export dialog summary.
  final String exportSummary;

  /// Export success message.
  final String exportReady;

  /// Generic close action.
  final String close;

  /// Erasure action.
  final String eraseData;

  /// Erasure dialog title.
  final String eraseTitle;

  /// Erasure dialog body.
  final String eraseBody;

  /// Erasure confirmation action.
  final String eraseConfirm;

  /// Erasure success message.
  final String eraseSuccess;

  /// Initial load failure.
  final String loadError;

  /// Retry action.
  final String retry;

  /// Last check-in label.
  final String lastCheckIn;

  /// Joined label.
  final String joined;

  /// Frozen-until label.
  final String frozenUntil;

  /// Freeze reason label.
  final String frozenReason;

  /// Unknown value label.
  final String unknown;

  /// Generic action failure.
  final String actionFailed;

  /// Progress success message.
  final String added;

  /// Consent granted message.
  final String consentGranted;

  /// Consent withdrawn message.
  final String consentWithdrawn;

  /// Health-consent warning.
  final String medicalConsentRequired;

  /// Formats a full date.
  String date(DateTime value) =>
      '${_months[value.month - 1]} ${value.day}, ${value.year}';

  /// Formats a month and day.
  String monthDay(DateTime value) => '${_months[value.month - 1]} ${value.day}';

  /// Formats a progress entry count.
  String entries(int count) => count == 1 ? '1 entry' : '$count entries';

  /// Formats a consent count.
  String consentCount(int granted, int total) => '$granted/$total';

  /// Human label for a consent key.
  String consentLabel(String key) => switch (key) {
    'health_data' => 'Health data',
    'marketing' => 'Marketing',
    'progress_photos' => 'Progress photos',
    'analytics' => 'Analytics',
    _ => key.replaceAll('_', ' '),
  };

  /// Description for a consent key.
  String consentDescription(String key) => switch (key) {
    'health_data' => 'Medical notes and conditions',
    'marketing' => 'Offers, news and re-engagement',
    'progress_photos' => 'Photos attached to progress entries',
    'analytics' => 'Anonymized product usage',
    _ => '',
  };

  /// Human label for a progress kind.
  String kindLabel(String kind) => switch (kind) {
    'PersonalRecord' => 'Personal record',
    'Measurement' => 'Measurement',
    'Photo' => 'Photo',
    _ => kind,
  };

  /// Human label for a device platform.
  String platformLabel(String platform) => switch (platform.toLowerCase()) {
    'ios' => 'iPhone',
    'android' => 'Android',
    'web' => 'Web browser',
    _ => platform.isEmpty ? unknown : platform,
  };

  static const List<String> _months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
}
