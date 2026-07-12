import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';
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

class _SafetyBarState extends State<SafetyBar> with SingleTickerProviderStateMixin {
  bool _recording = false;
  bool _busy = false;
  final AudioRecorder _recorder = AudioRecorder();
  late final AnimationController _pulse;
  DateTime? _startedAt;
  String? _recordingId;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 850),
      lowerBound: .35,
      upperBound: 1,
    );
  }

  @override
  void dispose() {
    _pulse.dispose();
    _recorder.dispose();
    super.dispose();
  }

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
    if (_busy) return;
    setState(() => _busy = true);
    final api = ApiClient(token: widget.token);
    try {
      if (!_recording) {
        final permission = await Permission.microphone.request();
        if (!permission.isGranted) {
          throw Exception('Microphone permission is required for safety recording.');
        }
        final directory = await getTemporaryDirectory();
        final path = '${directory.path}/jala-safety-${DateTime.now().millisecondsSinceEpoch}.m4a';
        await _recorder.start(
          const RecordConfig(encoder: AudioEncoder.aacLc, bitRate: 64000),
          path: path,
        );
        final response = await api.uploadRecording(rideId: widget.rideId, active: true);
        _recordingId = (response['recording'] as Map?)?['id']?.toString();
        _startedAt = DateTime.now();
        _pulse.repeat(reverse: true);
        if (mounted) setState(() => _recording = true);
      } else {
        final path = await _recorder.stop();
        _pulse.stop();
        if (mounted) setState(() => _recording = false);
        final duration = DateTime.now().difference(_startedAt ?? DateTime.now()).inSeconds;
        String? fileData;
        if (path != null) {
          final bytes = await File(path).readAsBytes();
          fileData = 'data:audio/m4a;base64,${base64Encode(bytes)}';
        }
        await api.uploadRecording(
          rideId: widget.rideId,
          active: false,
          recordingId: _recordingId,
          fileData: fileData,
          mimeType: 'audio/m4a',
          durationSec: duration,
        );
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_recording ? 'Silent recording started' : 'Recording securely uploaded')),
      );
    } catch (e) {
      if (!_recording && await _recorder.isRecording()) {
        await _recorder.stop();
      }
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) setState(() => _busy = false);
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
            minimumSize: const Size(44, 52),
              side: const BorderSide(color: Tokens.red500),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _busy ? null : _toggleRecord,
            icon: Icon(_recording ? Icons.mic : Icons.mic_off, color: Tokens.gold500),
            label: FadeTransition(
              opacity: _recording ? _pulse : const AlwaysStoppedAnimation(1),
              child: Text(
                _recording ? 'Recording…' : 'Silent record',
                style: TextStyle(
                  color: _recording ? Tokens.red500 : Tokens.gold500,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            style: OutlinedButton.styleFrom(minimumSize: const Size(44, 52)),
          ),
        ),
      ],
    );
  }
}
