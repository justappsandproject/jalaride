import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';

class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key, required this.token});

  final String token;

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  bool _online = false;
  bool _busy = false;
  List<dynamic> _jobs = [];
  Map<String, dynamic>? _pendingRequest;
  Timer? _demoTimer;

  ApiClient get _api => ApiClient(token: widget.token);

  @override
  void dispose() {
    _demoTimer?.cancel();
    super.dispose();
  }

  Future<void> _toggleOnline() async {
    setState(() => _busy = true);
    try {
      if (_online) {
        await _api.goOffline();
        _demoTimer?.cancel();
        setState(() {
          _online = false;
          _pendingRequest = null;
          _jobs = [];
        });
      } else {
        await _api.goOnline();
        setState(() => _online = true);
        _demoTimer = Timer(const Duration(seconds: 2), () {
          if (mounted && _online) {
            setState(() {
              _pendingRequest = {
                'riderName': 'Chioma A.',
                'pickup': 'Wuse Market, Abuja',
                'distance': '1.2 km',
                'fare': 1850,
              };
            });
            _showRequestDialog();
          }
        });
        await _loadJobs();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Brand.error),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _loadJobs() async {
    try {
      final jobs = await _api.availableRides();
      if (mounted) setState(() => _jobs = jobs);
    } catch (_) {}
  }

  void _showRequestDialog() {
    final req = _pendingRequest;
    if (req == null) return;
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => TripRequestDialog(
        request: req,
        onDecline: () {
          setState(() => _pendingRequest = null);
          Navigator.pop(ctx);
        },
        onAccept: () {
          setState(() => _pendingRequest = null);
          Navigator.pop(ctx);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Trip accepted!'), backgroundColor: Brand.success),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Earnings today', style: TextStyle(color: Brand.textSecondary)),
                  Text('₦12,400', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: Brand.accent)),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Brand.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Brand.primary.withValues(alpha: 0.3)),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('JA-234-ABA', style: TextStyle(fontWeight: FontWeight.w700)),
                    Text('Toyota Corolla', style: TextStyle(color: Brand.textSecondary, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _busy ? null : _toggleOnline,
            style: ElevatedButton.styleFrom(
              backgroundColor: _online ? Brand.error : Brand.primary,
              minimumSize: const Size.fromHeight(56),
            ),
            child: Text(_busy ? '…' : (_online ? 'Go Offline' : 'Go Online')),
          ),
          if (_online) ...[
            const SizedBox(height: 24),
            const Text('Available jobs', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            if (_jobs.isEmpty)
              const Text('Waiting for ride requests…', style: TextStyle(color: Brand.textSecondary))
            else
              ..._jobs.map((j) {
                final m = j as Map<String, dynamic>;
                return Card(
                  child: ListTile(
                    title: Text(m['destLabel']?.toString() ?? 'Ride'),
                    subtitle: Text('₦${m['fareEstimate'] ?? '—'}'),
                    trailing: IconButton(
                      icon: const Icon(Icons.check_circle, color: Brand.success),
                      onPressed: () => _api.acceptRide(m['id'].toString()),
                    ),
                  ),
                );
              }),
          ],
        ],
      ),
    );
  }
}

class TripRequestDialog extends StatelessWidget {
  const TripRequestDialog({
    super.key,
    required this.request,
    required this.onAccept,
    required this.onDecline,
  });

  final Map<String, dynamic> request;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Brand.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('New trip request', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
            const SizedBox(height: 16),
            Text(request['riderName']?.toString() ?? 'Rider', style: const TextStyle(fontSize: 18)),
            Text(request['pickup']?.toString() ?? '', style: const TextStyle(color: Brand.textSecondary)),
            Text('${request['distance']} · ₦${request['fare']}', style: const TextStyle(color: Brand.accent)),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(child: OutlinedButton(onPressed: onDecline, child: const Text('Decline'))),
                const SizedBox(width: 12),
                Expanded(child: ElevatedButton(onPressed: onAccept, child: const Text('Accept'))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class RemittanceScreen extends StatelessWidget {
  const RemittanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Weekly remittance', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          const Text('Government fleet — Toyota Corolla 2021', style: TextStyle(color: Brand.textSecondary)),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Due this week', style: TextStyle(color: Brand.textSecondary)),
                  const Text('₦76,923', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w800, color: Brand.accent)),
                  const SizedBox(height: 8),
                  const Text('Status: Pending', style: TextStyle(color: Brand.error)),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(onPressed: () {}, child: const Text('Mark as paid')),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class EarningsScreen extends StatelessWidget {
  const EarningsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('This week', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
          SizedBox(height: 16),
          _StatRow(label: 'Completed trips', value: '18'),
          _StatRow(label: 'Gross revenue', value: '₦48,200'),
          _StatRow(label: 'Est. payout', value: '₦31,500'),
        ],
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Brand.textSecondary)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
