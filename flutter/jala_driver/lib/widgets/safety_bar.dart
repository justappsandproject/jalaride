import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/api_client.dart';
import '../theme/tokens.dart';

class SafetyBar extends StatefulWidget {
  const SafetyBar({super.key, required this.token, this.rideId});

  final String token;
  final String? rideId;

  @override
  State<SafetyBar> createState() => _SafetyBarState();
}

class _SafetyBarState extends State<SafetyBar> {
  bool _recording = false;

  Future<void> _sos({bool silent = false}) async {
    if (!silent) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: Tokens.bgSurface,
          title: const Text('Trigger SOS?'),
          content: const Text('This alerts Jala Ride safety and dials 112.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
            TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: TextButton.styleFrom(foregroundColor: Tokens.red500),
              child: const Text('Send SOS'),
            ),
          ],
        ),
      );
      if (ok != true) return;
    }
    final api = ApiClient(token: widget.token);
    Position? pos;
    try {
      pos = await Geolocator.getCurrentPosition();
    } catch (_) {}
    final res = await api.triggerSos(
      rideId: widget.rideId,
      lat: pos?.latitude,
      lng: pos?.longitude,
      silent: silent,
    );
    if (!silent) {
      await launchUrl(Uri.parse('tel:112'));
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message']?.toString() ?? 'Safety alert sent'), backgroundColor: Tokens.red500),
      );
    }
  }

  Future<void> _toggleRecord() async {
    final api = ApiClient(token: widget.token);
    final next = !_recording;
    await api.toggleRecording(rideId: widget.rideId, active: next);
    setState(() => _recording = next);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(next ? 'Silent recording started' : 'Recording stopped')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => _sos(silent: false),
            icon: const Icon(Icons.sos, color: Tokens.red500),
            label: const Text('SOS', style: TextStyle(color: Tokens.red500)),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(44, 48),
              side: const BorderSide(color: Tokens.red500),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _toggleRecord,
            icon: Icon(_recording ? Icons.mic : Icons.mic_off, color: Tokens.gold500),
            label: Text(
              _recording ? 'Recording…' : 'Silent record',
              style: const TextStyle(color: Tokens.gold500),
            ),
            style: OutlinedButton.styleFrom(minimumSize: const Size(44, 48)),
          ),
        ),
      ],
    );
  }
}
