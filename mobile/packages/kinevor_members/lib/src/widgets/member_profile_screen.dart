import 'package:flutter/material.dart';

import '../data/members_api_exception.dart';
import '../data/members_repository.dart';
import '../models/member_profile.dart';
import '../theme/kinevor_members_theme.dart';
import '../theme/members_strings.dart';
import 'member_privacy_screen.dart';

/// Member self-service dashboard with profile facts and progress timeline.
class MemberProfileScreen extends StatefulWidget {
  /// Creates the member dashboard.
  const MemberProfileScreen({
    super.key,
    required this.repository,
    this.strings = const MembersStrings(),
  });

  /// Data source used for profile, progress, consent and device reads.
  final MembersRepository repository;

  /// Localized labels.
  final MembersStrings strings;

  @override
  State<MemberProfileScreen> createState() => _MemberProfileScreenState();
}

class _MemberProfileScreenState extends State<MemberProfileScreen> {
  MemberProfile? _profile;
  List<ProgressEntry> _progress = const [];
  List<MemberConsent> _consents = const [];
  List<MemberDevice> _devices = const [];
  bool _loading = true;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final profile = await widget.repository.getProfile();
      final progress = await widget.repository.getProgress();
      final consents = await widget.repository.getConsents();
      final devices = await widget.repository.getDevices();
      if (!mounted) return;
      setState(() {
        _profile = profile;
        _progress = progress;
        _consents = consents;
        _devices = devices;
        _loading = false;
      });
    } on Exception catch (error) {
      if (!mounted) return;
      setState(() {
        _error = _clean(error);
        _loading = false;
      });
    }
  }

  String _clean(Object error) =>
      error is MembersApiException ? error.message : error.toString();

  int get _grantedConsents =>
      _consents.where((consent) => consent.granted).length;

  Future<void> _openPrivacy() async {
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => MemberPrivacyScreen(
          repository: widget.repository,
          strings: widget.strings,
        ),
      ),
    );
    if (mounted) await _load();
  }

  Future<void> _logProgress() async {
    final draft = await showModalBottomSheet<_ProgressDraft>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _AddProgressSheet(strings: widget.strings),
    );
    if (draft == null || !mounted) return;

    setState(() => _busy = true);
    try {
      await widget.repository.addProgress(
        kind: draft.kind,
        label: draft.label,
        value: draft.value,
        unit: draft.unit,
        notes: draft.notes,
      );
      final progress = await widget.repository.getProgress();
      if (!mounted) return;
      setState(() {
        _progress = progress;
        _busy = false;
      });
      _showMessage(widget.strings.added);
    } on Exception catch (error) {
      if (!mounted) return;
      setState(() => _busy = false);
      _showMessage(_clean(error));
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final strings = widget.strings;
    return Scaffold(
      appBar: AppBar(
        title: Text(strings.title),
        actions: [
          IconButton(
            tooltip: strings.managePrivacy,
            onPressed: _profile == null ? null : _openPrivacy,
            icon: const Icon(Icons.shield_outlined),
          ),
          const SizedBox(width: 6),
        ],
      ),
      body: SafeArea(
        child: Stack(
          children: [
            if (_loading && _profile == null)
              const Center(child: CircularProgressIndicator())
            else if (_profile == null)
              _ErrorState(
                message: _error ?? strings.loadError,
                retryLabel: strings.retry,
                onRetry: _load,
              )
            else
              RefreshIndicator(
                onRefresh: _load,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _ProfileHero(profile: _profile!, strings: strings),
                      if (_profile!.status.toLowerCase() == 'frozen') ...[
                        const SizedBox(height: 10),
                        _FreezeBanner(profile: _profile!, strings: strings),
                      ],
                      const SizedBox(height: 12),
                      _StatsRow(
                        profile: _profile!,
                        grantedConsents: _grantedConsents,
                        totalConsents: _consents.length,
                        strings: strings,
                      ),
                      const SizedBox(height: 16),
                      _ProgressCard(
                        entries: _progress,
                        strings: strings,
                        onLog: _busy ? null : _logProgress,
                      ),
                      const SizedBox(height: 16),
                      _ContactCard(profile: _profile!, strings: strings),
                      const SizedBox(height: 16),
                      _PrivacyTeaser(
                        strings: strings,
                        onTap: _openPrivacy,
                        devices: _devices.length,
                      ),
                    ],
                  ),
                ),
              ),
            if (_busy)
              const Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: LinearProgressIndicator(minHeight: 2),
              ),
          ],
        ),
      ),
    );
  }
}

class _ProfileHero extends StatelessWidget {
  const _ProfileHero({required this.profile, required this.strings});

  final MemberProfile profile;
  final MembersStrings strings;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            KinevorMembersTheme.accent.withValues(alpha: 0.24),
            KinevorMembersTheme.surfaceRaised,
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: KinevorMembersTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 58,
                height: 58,
                decoration: BoxDecoration(
                  gradient: KinevorMembersTheme.brandGradient,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: KinevorMembersTheme.accent.withValues(alpha: 0.3),
                      blurRadius: 18,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: Text(
                  profile.initials,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: KinevorMembersTheme.onAccent,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      strings.profileEyebrow,
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.4,
                        color: KinevorMembersTheme.accent,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      profile.fullName,
                      style: Theme.of(context).textTheme.headlineSmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      profile.memberNumber,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: KinevorMembersTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: Row(
                  children: [
                    const Icon(
                      Icons.event_outlined,
                      size: 13,
                      color: KinevorMembersTheme.textMuted,
                    ),
                    const SizedBox(width: 5),
                    Flexible(
                      child: Text(
                        '${strings.joined} ${strings.date(profile.joinedAt)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: KinevorMembersTheme.textMuted,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _StatusChip(status: profile.status),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: KinevorMembersTheme.ink.withValues(alpha: 0.45),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                _HeroLine(icon: Icons.mail_outline, text: profile.email),
                const SizedBox(height: 6),
                _HeroLine(icon: Icons.call_outlined, text: profile.phone),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroLine extends StatelessWidget {
  const _HeroLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: KinevorMembersTheme.textMuted),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: Theme.of(
              context,
            ).textTheme.bodySmall?.copyWith(color: KinevorMembersTheme.text),
          ),
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = KinevorMembersTheme.statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(KinevorMembersTheme.statusIcon(status), size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            status.toUpperCase(),
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.5,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _FreezeBanner extends StatelessWidget {
  const _FreezeBanner({required this.profile, required this.strings});

  final MemberProfile profile;
  final MembersStrings strings;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: KinevorMembersTheme.info.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: KinevorMembersTheme.info.withValues(alpha: 0.3),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.ac_unit_outlined,
            size: 17,
            color: KinevorMembersTheme.info,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              [
                if (profile.frozenUntil != null)
                  '${strings.frozenUntil} ${strings.date(profile.frozenUntil!)}',
                if (profile.freezeReason != null)
                  '${strings.frozenReason}: ${profile.freezeReason}',
              ].join(' | '),
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: KinevorMembersTheme.info),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({
    required this.profile,
    required this.grantedConsents,
    required this.totalConsents,
    required this.strings,
  });

  final MemberProfile profile;
  final int grantedConsents;
  final int totalConsents;
  final MembersStrings strings;

  String get _weight {
    final weight = profile.weightKg;
    if (weight == null) return '-';
    return weight == weight.roundToDouble()
        ? weight.toStringAsFixed(0)
        : weight.toStringAsFixed(1);
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            value: '${profile.totalCheckIns}',
            label: strings.checkIns,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatCard(value: '${profile.age}', label: strings.age),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatCard(value: _weight, label: '${strings.weight} (kg)'),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _StatCard(
            value: strings.consentCount(grantedConsents, totalConsents),
            label: strings.consents,
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 12),
      decoration: BoxDecoration(
        color: KinevorMembersTheme.surfaceRaised,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: KinevorMembersTheme.border),
      ),
      child: Column(
        children: [
          Text(
            value,
            maxLines: 1,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.4,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label.toUpperCase(),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 7.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.45,
              color: KinevorMembersTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  const _ProgressCard({
    required this.entries,
    required this.strings,
    required this.onLog,
  });

  final List<ProgressEntry> entries;
  final MembersStrings strings;
  final VoidCallback? onLog;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    strings.progressTitle,
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 9,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: KinevorMembersTheme.accent.withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    strings.entries(entries.length),
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: KinevorMembersTheme.accent,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            if (entries.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  strings.noProgress,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: KinevorMembersTheme.textMuted,
                  ),
                ),
              )
            else
              for (var index = 0; index < entries.length; index++) ...[
                _ProgressRow(entry: entries[index], strings: strings),
                if (index != entries.length - 1) const Divider(),
              ],
            const SizedBox(height: 6),
            OutlinedButton.icon(
              onPressed: onLog,
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(44),
                foregroundColor: KinevorMembersTheme.text,
                side: const BorderSide(color: KinevorMembersTheme.border),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: const Icon(Icons.add, size: 18),
              label: Text(strings.logProgress),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({required this.entry, required this.strings});

  final ProgressEntry entry;
  final MembersStrings strings;

  String get _value {
    final value = entry.value;
    if (value == null) return '-';
    final text = value == value.roundToDouble()
        ? value.toStringAsFixed(0)
        : value.toStringAsFixed(1);
    final unit = entry.unit;
    return unit == null || unit.isEmpty ? text : '$text $unit';
  }

  @override
  Widget build(BuildContext context) {
    final color = KinevorMembersTheme.progressColor(entry.kind);
    final label = entry.label == null || entry.label!.isEmpty
        ? strings.kindLabel(entry.kind)
        : entry.label!;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.13),
              borderRadius: BorderRadius.circular(11),
            ),
            alignment: Alignment.center,
            child: Icon(
              KinevorMembersTheme.progressIcon(entry.kind),
              size: 18,
              color: color,
            ),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  strings.monthDay(entry.recordedAt),
                  style: const TextStyle(
                    fontSize: 10.5,
                    color: KinevorMembersTheme.textMuted,
                  ),
                ),
                if (entry.notes != null && entry.notes!.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    entry.notes!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 10.5,
                      color: KinevorMembersTheme.textMuted,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _value,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
          ),
        ],
      ),
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({required this.profile, required this.strings});

  final MemberProfile profile;
  final MembersStrings strings;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              strings.contactTitle,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            _FactRow(
              icon: Icons.cake_outlined,
              label: strings.dateOfBirth,
              value: strings.date(profile.dateOfBirth),
            ),
            const Divider(),
            _FactRow(
              icon: Icons.home_outlined,
              label: strings.address,
              value: profile.fullAddress,
            ),
            const Divider(),
            _FactRow(
              icon: Icons.contact_emergency_outlined,
              label: strings.emergencyContact,
              value: profile.emergencyContactName ?? strings.noneRecorded,
            ),
            const Divider(),
            _FactRow(
              icon: Icons.call_outlined,
              label: strings.emergencyPhone,
              value: profile.emergencyContactPhone ?? strings.noneRecorded,
            ),
            const Divider(),
            _FactRow(
              icon: Icons.medical_information_outlined,
              label: strings.medicalNotes,
              value: profile.medicalNotes ?? strings.noneRecorded,
            ),
          ],
        ),
      ),
    );
  }
}

class _FactRow extends StatelessWidget {
  const _FactRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: KinevorMembersTheme.textMuted),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 8.5,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                    color: KinevorMembersTheme.textMuted,
                  ),
                ),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 12.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PrivacyTeaser extends StatelessWidget {
  const _PrivacyTeaser({
    required this.strings,
    required this.onTap,
    required this.devices,
  });

  final MembersStrings strings;
  final VoidCallback onTap;
  final int devices;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(18),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: KinevorMembersTheme.success.withValues(alpha: 0.13),
                  borderRadius: BorderRadius.circular(12),
                ),
                alignment: Alignment.center,
                child: const Icon(
                  Icons.shield_outlined,
                  size: 21,
                  color: KinevorMembersTheme.success,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      strings.privacyTitle,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      devices == 1
                          ? '1 registered device'
                          : '$devices registered devices',
                      style: const TextStyle(
                        fontSize: 11,
                        color: KinevorMembersTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.chevron_right,
                color: KinevorMembersTheme.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({
    required this.message,
    required this.retryLabel,
    required this.onRetry,
  });

  final String message;
  final String retryLabel;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline,
              size: 34,
              color: KinevorMembersTheme.error,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: KinevorMembersTheme.textMuted,
              ),
            ),
            const SizedBox(height: 14),
            FilledButton(onPressed: onRetry, child: Text(retryLabel)),
          ],
        ),
      ),
    );
  }
}

class _ProgressDraft {
  const _ProgressDraft({
    required this.kind,
    this.label,
    this.value,
    this.unit,
    this.notes,
  });

  final String kind;
  final String? label;
  final double? value;
  final String? unit;
  final String? notes;
}

class _AddProgressSheet extends StatefulWidget {
  const _AddProgressSheet({required this.strings});

  final MembersStrings strings;

  @override
  State<_AddProgressSheet> createState() => _AddProgressSheetState();
}

class _AddProgressSheetState extends State<_AddProgressSheet> {
  final _label = TextEditingController();
  final _value = TextEditingController();
  final _unit = TextEditingController(text: 'kg');
  final _notes = TextEditingController();
  String _kind = memberProgressKinds.first;

  @override
  void dispose() {
    _label.dispose();
    _value.dispose();
    _unit.dispose();
    _notes.dispose();
    super.dispose();
  }

  void _submit() {
    final parsed = double.tryParse(_value.text.trim().replaceAll(',', '.'));
    Navigator.of(context).pop(
      _ProgressDraft(
        kind: _kind,
        label: _label.text.trim().isEmpty ? null : _label.text.trim(),
        value: parsed,
        unit: _unit.text.trim().isEmpty ? null : _unit.text.trim(),
        notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final strings = widget.strings;
    return Padding(
      padding: EdgeInsets.fromLTRB(
        20,
        4,
        20,
        20 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              strings.logProgress,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 14),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final kind in memberProgressKinds)
                  ChoiceChip(
                    label: Text(strings.kindLabel(kind)),
                    selected: _kind == kind,
                    onSelected: (_) => setState(() => _kind = kind),
                    selectedColor: KinevorMembersTheme.accent.withValues(
                      alpha: 0.2,
                    ),
                    labelStyle: TextStyle(
                      color: _kind == kind
                          ? KinevorMembersTheme.accent
                          : KinevorMembersTheme.text,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                    side: BorderSide(
                      color: _kind == kind
                          ? KinevorMembersTheme.accent.withValues(alpha: 0.5)
                          : KinevorMembersTheme.border,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            TextField(
              controller: _label,
              decoration: InputDecoration(labelText: strings.labelOptional),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: _value,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    decoration: InputDecoration(labelText: strings.value),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _unit,
                    decoration: InputDecoration(labelText: strings.unit),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _notes,
              maxLines: 2,
              decoration: InputDecoration(labelText: strings.notesOptional),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: Text(strings.cancel),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: _submit,
                    style: FilledButton.styleFrom(
                      backgroundColor: KinevorMembersTheme.accent,
                      foregroundColor: KinevorMembersTheme.onAccent,
                    ),
                    child: Text(strings.addEntry),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
