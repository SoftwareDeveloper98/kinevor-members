import '../models/member_profile.dart';
import 'kinevor_members_client.dart';

/// Data source for the member self-service screens.
abstract interface class MembersRepository {
  /// Loads the authenticated member's profile.
  Future<MemberProfile> getProfile();

  /// Loads progress entries in reverse chronological order.
  Future<List<ProgressEntry>> getProgress();

  /// Loads consent records.
  Future<List<MemberConsent>> getConsents();

  /// Loads registered push devices.
  Future<List<MemberDevice>> getDevices();

  /// Records a progress entry.
  Future<void> addProgress({
    required String kind,
    String? label,
    double? value,
    String? unit,
    String? notes,
  });

  /// Grants a consent key.
  Future<void> grantConsent(String key);

  /// Withdraws a consent key.
  Future<void> withdrawConsent(String key);

  /// Exports the member-owned data in this module.
  Future<MemberPrivacyExport> exportData();

  /// Requests erasure of the member's module data.
  Future<ErasureResult> eraseData();
}

/// [MembersRepository] backed by [KinevorMembersClient].
class RemoteMembersRepository implements MembersRepository {
  /// Creates a repository over [client].
  const RemoteMembersRepository(this.client);

  /// HTTP client used for every call.
  final KinevorMembersClient client;

  @override
  Future<MemberProfile> getProfile() => client.fetchProfile();

  @override
  Future<List<ProgressEntry>> getProgress() => client.fetchProgress();

  @override
  Future<List<MemberConsent>> getConsents() => client.fetchConsents();

  @override
  Future<List<MemberDevice>> getDevices() => client.fetchDevices();

  @override
  Future<void> addProgress({
    required String kind,
    String? label,
    double? value,
    String? unit,
    String? notes,
  }) => client.addProgress(
    kind: kind,
    label: label,
    value: value,
    unit: unit,
    notes: notes,
  );

  @override
  Future<void> grantConsent(String key) => client.grantConsent(key);

  @override
  Future<void> withdrawConsent(String key) => client.withdrawConsent(key);

  @override
  Future<MemberPrivacyExport> exportData() => client.exportData();

  @override
  Future<ErasureResult> eraseData() => client.eraseData();
}
