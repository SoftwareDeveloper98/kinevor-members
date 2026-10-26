import 'package:flutter/material.dart';

import '../data/members_api_exception.dart';
import '../data/members_repository.dart';
import '../models/member_profile.dart';
import '../theme/kinevor_members_theme.dart';
import '../theme/members_strings.dart';

/// Consent, device and privacy controls for the authenticated member.
class MemberPrivacyScreen extends StatefulWidget {
  /// Creates the privacy screen.
  const MemberPrivacyScreen({
    super.key,
    required this.repository,
    this.strings = const MembersStrings(),
  });

  /// Data source used for consent, device and privacy actions.
  final MembersRepository repository;

  /// Localized labels.
  final MembersStrings strings;

  @override
  State<MemberPrivacyScreen> createState() => _MemberPrivacyScreenState();
}

class _MemberPrivacyScreenState extends State<MemberPrivacyScreen> {
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
      final consents = await widget.repository.getConsents();
      final devices = await widget.repository.getDevices();
      if (!mounted) return;
      setState(() {
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

  MemberConsent? _consent(String key) {
    for (final consent in _consents) {
      if (consent.key == key) return consent;
    }
    return null;
  }

  bool _isGranted(String key) => _consent(key)?.granted ?? false;

  Future<void> _toggle(String key, bool granted) async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      if (granted) {
        await widget.repository.grantConsent(key);
      } else {
        await widget.repository.withdrawConsent(key);
      }
      final consents = await widget.repository.getConsents();
      if (!mounted) return;
      setState(() {
        _consents = consents;
        _busy = false;
      });
      _showMessage(
        granted
            ? widget.strings.consentGranted
            : widget.strings.consentWithdrawn,
      );
    } on Exception catch (error) {
      if (!mounted) return;
      setState(() => _busy = false);
      _showMessage(_clean(error));
    }
  }

  Future<void> _export() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final data = await widget.repository.exportData();
      if (!mounted) return;
      setState(() => _busy = false);
      await showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(widget.strings.exportTitle),
          content: Text(
            '${widget.strings.exportSummary}\n\n'
            '${data.progress.length} progress entries\n'
            '${data.consents.length} consent records\n'
            '${data.devices.length} devices',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text(widget.strings.close),
            ),
          ],
        ),
      );
    } on Exception catch (error) {
      if (!mounted) return;
      setState(() => _busy = false);
      _showMessage(_clean(error));
    }
  }

  Future<void> _erase() async {
    if (_busy) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(widget.strings.eraseTitle),
        content: Text(widget.strings.eraseBody),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: Text(widget.strings.cancel),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            style: FilledButton.styleFrom(
              backgroundColor: KinevorMembersTheme.error,
              foregroundColor: KinevorMembersTheme.onAccent,
            ),
            child: Text(widget.strings.eraseConfirm),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    setState(() => _busy = true);
    try {
      final result = await widget.repository.eraseData();
      if (!mounted) return;
      setState(() => _busy = false);
      _showMessage(
        result.confirmation.isEmpty
            ? widget.strings.eraseSuccess
            : result.confirmation,
      );
      await _load();
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
      appBar: AppBar(title: Text(strings.privacyTitle)),
      body: SafeArea(
        child: Stack(
          children: [
            if (_loading)
              const Center(child: CircularProgressIndicator())
            else if (_error != null)
              _PrivacyError(
                message: _error!,
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
                      _PrivacyHero(strings: strings),
                      const SizedBox(height: 16),
                      _ConsentCard(
                        strings: strings,
                        isGranted: _isGranted,
                        busy: _busy,
                        onChanged: _toggle,
                      ),
                      const SizedBox(height: 16),
                      _DeviceCard(devices: _devices, strings: strings),
                      const SizedBox(height: 16),
                      _PrivacyRightsCard(
                        strings: strings,
                        busy: _busy,
                        onExport: _export,
                        onErase: _erase,
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

class _PrivacyHero extends StatelessWidget {
  const _PrivacyHero({required this.strings});

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
            KinevorMembersTheme.success.withValues(alpha: 0.2),
            KinevorMembersTheme.surfaceRaised,
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: KinevorMembersTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: KinevorMembersTheme.success.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(16),
            ),
            alignment: Alignment.center,
            child: const Icon(
              Icons.shield_outlined,
              size: 27,
              color: KinevorMembersTheme.success,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.privacyEyebrow,
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.4,
                    color: KinevorMembersTheme.success,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  strings.privacyRightsTitle,
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: 3),
                Text(
                  'Consent, devices and personal data in one place.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: KinevorMembersTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ConsentCard extends StatelessWidget {
  const _ConsentCard({
    required this.strings,
    required this.isGranted,
    required this.busy,
    required this.onChanged,
  });

  final MembersStrings strings;
  final bool Function(String) isGranted;
  final bool busy;
  final void Function(String, bool) onChanged;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              strings.consentsTitle,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 3),
            Text(
              strings.consentNote,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: KinevorMembersTheme.textMuted,
              ),
            ),
            const SizedBox(height: 8),
            for (final key in memberConsentKeys)
              _ConsentRow(
                keyName: key,
                strings: strings,
                granted: isGranted(key),
                enabled: !busy,
                onChanged: (value) => onChanged(key, value),
              ),
          ],
        ),
      ),
    );
  }
}

class _ConsentRow extends StatelessWidget {
  const _ConsentRow({
    required this.keyName,
    required this.strings,
    required this.granted,
    required this.enabled,
    required this.onChanged,
  });

  final String keyName;
  final MembersStrings strings;
  final bool granted;
  final bool enabled;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color:
                  (granted
                          ? KinevorMembersTheme.success
                          : KinevorMembersTheme.textMuted)
                      .withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(9),
            ),
            alignment: Alignment.center,
            child: Icon(
              granted ? Icons.check : Icons.remove,
              size: 16,
              color: granted
                  ? KinevorMembersTheme.success
                  : KinevorMembersTheme.textMuted,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.consentLabel(keyName),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  strings.consentDescription(keyName),
                  style: const TextStyle(
                    fontSize: 10.5,
                    color: KinevorMembersTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            key: ValueKey<String>('consent-$keyName'),
            value: granted,
            onChanged: enabled ? onChanged : null,
            activeThumbColor: KinevorMembersTheme.accent,
          ),
        ],
      ),
    );
  }
}

class _DeviceCard extends StatelessWidget {
  const _DeviceCard({required this.devices, required this.strings});

  final List<MemberDevice> devices;
  final MembersStrings strings;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              strings.devicesTitle,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 10),
            if (devices.isEmpty)
              Text(
                strings.noDevices,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: KinevorMembersTheme.textMuted,
                ),
              )
            else
              for (var index = 0; index < devices.length; index++) ...[
                _DeviceRow(device: devices[index], strings: strings),
                if (index != devices.length - 1) const Divider(),
              ],
          ],
        ),
      ),
    );
  }
}

class _DeviceRow extends StatelessWidget {
  const _DeviceRow({required this.device, required this.strings});

  final MemberDevice device;
  final MembersStrings strings;

  @override
  Widget build(BuildContext context) {
    final icon = device.platform.toLowerCase() == 'ios'
        ? Icons.phone_iphone
        : device.platform.toLowerCase() == 'android'
        ? Icons.phone_android
        : Icons.devices_other;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 9),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: KinevorMembersTheme.accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: Icon(icon, size: 18, color: KinevorMembersTheme.accent),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  strings.platformLabel(device.platform),
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 1),
                Text(
                  device.tokenPreview,
                  style: const TextStyle(
                    fontSize: 10.5,
                    color: KinevorMembersTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
          Text(
            strings.date(device.registeredAt),
            style: const TextStyle(
              fontSize: 10,
              color: KinevorMembersTheme.textMuted,
            ),
          ),
        ],
      ),
    );
  }
}

class _PrivacyRightsCard extends StatelessWidget {
  const _PrivacyRightsCard({
    required this.strings,
    required this.busy,
    required this.onExport,
    required this.onErase,
  });

  final MembersStrings strings;
  final bool busy;
  final VoidCallback onExport;
  final VoidCallback onErase;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              strings.privacyRightsTitle,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            Text(
              strings.privacyRightsBody,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: KinevorMembersTheme.textMuted,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 14),
            OutlinedButton.icon(
              onPressed: busy ? null : onExport,
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(44),
                foregroundColor: KinevorMembersTheme.text,
                side: const BorderSide(color: KinevorMembersTheme.border),
              ),
              icon: const Icon(Icons.download_outlined, size: 18),
              label: Text(strings.exportData),
            ),
            const SizedBox(height: 6),
            TextButton.icon(
              onPressed: busy ? null : onErase,
              style: TextButton.styleFrom(
                foregroundColor: KinevorMembersTheme.error,
                minimumSize: const Size.fromHeight(44),
              ),
              icon: const Icon(Icons.delete_outline, size: 18),
              label: Text(strings.eraseData),
            ),
          ],
        ),
      ),
    );
  }
}

class _PrivacyError extends StatelessWidget {
  const _PrivacyError({
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
