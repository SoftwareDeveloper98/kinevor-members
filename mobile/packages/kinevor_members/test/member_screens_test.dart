import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kinevor_members/kinevor_members.dart';

import 'fake_members_repository.dart';

void main() {
  testWidgets('profile renders hero, stats and progress', (tester) async {
    final repository = FakeMembersRepository();

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembersTheme.dark(),
        home: MemberProfileScreen(repository: repository),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Maya Thompson'), findsOneWidget);
    expect(find.text('KZN-2026-00001'), findsOneWidget);
    expect(find.text('Member since Dec 20, 2025'), findsOneWidget);
    expect(find.text('42'), findsOneWidget);
    expect(find.text('3/3'), findsOneWidget);
    expect(find.text('Back squat'), findsOneWidget);
    expect(find.text('95 kg'), findsOneWidget);
  });

  testWidgets('profile records a progress entry', (tester) async {
    final repository = FakeMembersRepository();

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembersTheme.dark(),
        home: MemberProfileScreen(repository: repository),
      ),
    );
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Log progress'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Log progress'));
    await tester.pumpAndSettle();

    expect(find.text('Add entry'), findsOneWidget);
    await tester.enterText(find.byType(TextField).at(1), '67.2');
    await tester.tap(find.text('Add entry'));
    await tester.pumpAndSettle();

    expect(repository.addProgressCalls, 1);
    expect(repository.lastValue, 67.2);
    expect(repository.lastUnit, 'kg');
    expect(find.text('67.2 kg'), findsOneWidget);
  });

  testWidgets('privacy screen withdraws a granted consent', (tester) async {
    final repository = FakeMembersRepository();

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembersTheme.dark(),
        home: MemberProfileScreen(repository: repository),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byTooltip('Manage privacy and devices'));
    await tester.pumpAndSettle();

    expect(find.text('Privacy & devices'), findsOneWidget);
    final toggle = find.byKey(const ValueKey<String>('consent-health_data'));
    expect(tester.widget<Switch>(toggle).value, isTrue);

    await tester.tap(toggle);
    await tester.pumpAndSettle();

    expect(repository.withdrawCalls, 1);
    expect(tester.widget<Switch>(toggle).value, isFalse);
  });

  testWidgets('privacy export and erasure call the repository', (tester) async {
    final repository = FakeMembersRepository();

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembersTheme.dark(),
        home: MemberPrivacyScreen(repository: repository),
      ),
    );
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Export my data'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Export my data'));
    await tester.pumpAndSettle();

    expect(repository.exportCalls, 1);
    expect(find.text('Your data export'), findsOneWidget);
    await tester.tap(find.text('Close'));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Request erasure'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Request erasure'));
    await tester.pumpAndSettle();

    expect(find.text('Erase your data?'), findsOneWidget);
    await tester.tap(find.text('Erase my data'));
    await tester.pumpAndSettle();

    expect(repository.eraseCalls, 1);
    expect(find.text('Your erasure request was processed.'), findsOneWidget);
  });

  testWidgets('load failures show a retry action', (tester) async {
    final repository = FakeMembersRepository(
      failure: const MembersApiException('Members API unavailable.'),
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: KinevorMembersTheme.dark(),
        home: MemberProfileScreen(repository: repository),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Members API unavailable.'), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
  });
}
