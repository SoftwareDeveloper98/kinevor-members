/// Failure reported by the Kinevor members API.
class MembersApiException implements Exception {
  /// Creates an exception with a message and optional HTTP status.
  const MembersApiException(this.message, {this.statusCode});

  /// Human-readable failure.
  final String message;

  /// HTTP status code, when a response was received.
  final int? statusCode;

  @override
  String toString() => 'MembersApiException($statusCode): $message';
}
