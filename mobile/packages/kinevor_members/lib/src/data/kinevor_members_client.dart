import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/member_profile.dart';
import 'members_api_exception.dart';

/// HTTP client for the Kinevor member self-service API.
///
/// Extra [headers] are attached to every request. The demo uses them for the
/// development-only `X-Demo-Role` and `X-Demo-Member` trust headers, while a
/// production host can supply an authenticated client instead.
class KinevorMembersClient {
  /// Creates a client rooted at [baseUrl], for example
  /// `https://api.example.com/api/v1`.
  KinevorMembersClient({
    required Uri baseUrl,
    http.Client? httpClient,
    Map<String, String> headers = const {},
  }) : _baseUrl = baseUrl,
       _http = httpClient ?? http.Client(),
       _ownsClient = httpClient == null,
       _headers = Map.unmodifiable(headers);

  final Uri _baseUrl;
  final http.Client _http;
  final bool _ownsClient;
  final Map<String, String> _headers;

  /// Loads the authenticated member's profile.
  Future<MemberProfile> fetchProfile() async {
    final data = await _object('GET', 'me/profile');
    return MemberProfile.fromJson(data);
  }

  /// Loads progress entries in reverse chronological order.
  Future<List<ProgressEntry>> fetchProgress() async {
    final data = await _list('GET', 'me/progress');
    return [
      for (final item in data)
        ProgressEntry.fromJson(Map<String, dynamic>.from(item as Map)),
    ];
  }

  /// Records a progress entry.
  Future<void> addProgress({
    required String kind,
    String? label,
    double? value,
    String? unit,
    String? notes,
    DateTime? recordedAt,
  }) async {
    await _send(
      'POST',
      'me/progress',
      body: {
        'kind': kind,
        if (label != null && label.isNotEmpty) 'label': label,
        'value': ?value,
        if (unit != null && unit.isNotEmpty) 'unit': unit,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        'recordedAt': ?recordedAt?.toUtc().toIso8601String(),
      },
    );
  }

  /// Loads the member's consent records.
  Future<List<MemberConsent>> fetchConsents() async {
    final data = await _list('GET', 'me/consents');
    return [
      for (final item in data)
        MemberConsent.fromJson(Map<String, dynamic>.from(item as Map)),
    ];
  }

  /// Grants a consent key.
  Future<void> grantConsent(String key) async {
    await _send(
      'POST',
      'me/consents/${Uri.encodeComponent(key)}',
      body: const {},
    );
  }

  /// Withdraws a consent key.
  Future<void> withdrawConsent(String key) async {
    await _send('DELETE', 'me/consents/${Uri.encodeComponent(key)}');
  }

  /// Loads registered push devices.
  Future<List<MemberDevice>> fetchDevices() async {
    final data = await _list('GET', 'me/devices');
    return [
      for (final item in data)
        MemberDevice.fromJson(Map<String, dynamic>.from(item as Map)),
    ];
  }

  /// Exports the member-owned data in this module.
  Future<MemberPrivacyExport> exportData() async {
    final data = await _object('GET', 'me/privacy/export');
    return MemberPrivacyExport.fromJson(data);
  }

  /// Anonymizes the member and purges module-owned personal data.
  Future<ErasureResult> eraseData() async {
    final data = await _object('POST', 'me/privacy/erasure', body: const {});
    return ErasureResult.fromJson(data);
  }

  /// Closes the underlying HTTP client when this instance created it.
  void close() {
    if (_ownsClient) _http.close();
  }

  Uri _endpoint(String path) {
    final base = _baseUrl.toString().replaceFirst(RegExp(r'/+$'), '');
    return Uri.parse('$base/$path');
  }

  Future<Map<String, dynamic>> _object(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final data = await _send(method, path, body: body);
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    throw const MembersApiException('The members response has no data object.');
  }

  Future<List<Object?>> _list(String method, String path) async {
    final data = await _send(method, path);
    if (data is List) return data;
    throw const MembersApiException('The members response has no data array.');
  }

  Future<Object?> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final request = http.Request(method, _endpoint(path))
      ..headers.addAll({
        'Accept': 'application/json',
        if (body != null) 'Content-Type': 'application/json',
        ..._headers,
      });
    if (body != null) request.body = jsonEncode(body);

    final http.StreamedResponse streamed;
    try {
      streamed = await _http.send(request);
    } on Exception catch (error) {
      throw MembersApiException('Could not reach the members API: $error');
    }

    final response = await http.Response.fromStream(streamed);
    final Object? decoded;
    try {
      decoded = response.body.isEmpty ? null : jsonDecode(response.body);
    } on FormatException {
      throw MembersApiException(
        'The members API returned invalid JSON.',
        statusCode: response.statusCode,
      );
    }

    if (decoded is! Map<String, dynamic>) {
      throw MembersApiException(
        'The members API returned an unexpected payload.',
        statusCode: response.statusCode,
      );
    }

    final success = decoded['success'] != false;
    if (response.statusCode < 200 || response.statusCode >= 300 || !success) {
      throw MembersApiException(
        _errorMessage(decoded) ?? 'The members request failed.',
        statusCode: response.statusCode,
      );
    }

    return decoded['data'];
  }

  String? _errorMessage(Map<String, dynamic> body) {
    final message = body['message'];
    if (message is String && message.isNotEmpty) return message;
    final errors = body['errors'];
    if (errors is List) {
      for (final error in errors) {
        if (error is String && error.isNotEmpty) return error;
        if (error is Map && error['message'] is String) {
          return error['message'] as String;
        }
      }
    }
    final detail = body['detail'];
    return detail is String && detail.isNotEmpty ? detail : null;
  }
}
