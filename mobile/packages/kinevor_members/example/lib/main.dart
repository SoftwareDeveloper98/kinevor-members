import 'package:flutter/material.dart';
import 'package:kinevor_members/kinevor_members.dart';

const String _apiBaseUrl = String.fromEnvironment(
  'KINEVOR_API_BASE_URL',
  defaultValue: 'http://localhost:5083/api/v1',
);

void main() {
  final client = KinevorMembersClient(
    baseUrl: Uri.parse(_apiBaseUrl),
    headers: const {
      'X-Demo-Role': 'Member',
      'X-Demo-Email': 'maya.thompson@kinevor.demo',
      'X-Demo-Member': '11111111-1111-1111-1111-111111111111',
    },
  );
  runApp(MembersDemoApp(repository: RemoteMembersRepository(client)));
}

/// Demo application hosting [MemberProfileScreen] against the members DemoApi.
class MembersDemoApp extends StatelessWidget {
  /// Creates the demo app.
  const MembersDemoApp({super.key, required this.repository});

  /// Data source used by the member screens.
  final MembersRepository repository;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Kinevor Members',
      debugShowCheckedModeBanner: false,
      theme: KinevorMembersTheme.dark(),
      home: MemberProfileScreen(repository: repository),
    );
  }
}
