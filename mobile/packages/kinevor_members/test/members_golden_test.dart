import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kinevor_members/kinevor_members.dart';

import 'fake_members_repository.dart';

Future<void> _loadFonts() async {
  final bytes = await File('assets/fonts/Sora-Variable.ttf').readAsBytes();
  final sora = FontLoader('Sora')
    ..addFont(Future<ByteData>.value(ByteData.sublistView(bytes)));
  await sora.load();

  final material = await rootBundle.load('fonts/MaterialIcons-Regular.otf');
  final icons = FontLoader('MaterialIcons')
    ..addFont(Future<ByteData>.value(material));
  await icons.load();
}

void main() {
  setUpAll(_loadFonts);

  testWidgets('profile golden', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembersTheme.dark(),
        home: MemberProfileScreen(repository: FakeMembersRepository()),
      ),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(MemberProfileScreen),
      matchesGoldenFile('goldens/member_profile.png'),
    );
  });

  testWidgets('privacy golden', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembersTheme.dark(),
        home: MemberPrivacyScreen(repository: FakeMembersRepository()),
      ),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(MemberPrivacyScreen),
      matchesGoldenFile('goldens/member_privacy.png'),
    );
  });
}
