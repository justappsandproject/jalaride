import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_client.dart';
import '../theme/app_theme.dart';
import '../widgets/password_field.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({
    super.key,
    required this.token,
    required this.isDriver,
    required this.onComplete,
  });

  final String token;
  final bool isDriver;
  final VoidCallback onComplete;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _page = PageController();
  int _step = 0;
  bool _loading = false;
  String? _error;

  final _nin = TextEditingController();
  final _name = TextEditingController();
  final _dob = TextEditingController();
  final _address = TextEditingController();
  final _phone = TextEditingController(text: '+234');
  final _email = TextEditingController();

  Map<String, dynamic>? _ninData;
  final _picker = ImagePicker();
  final Map<String, String> _uploads = {};

  ApiClient get _api => ApiClient(token: widget.token);

  @override
  void dispose() {
    _nin.dispose();
    _name.dispose();
    _dob.dispose();
    _address.dispose();
    _phone.dispose();
    _email.dispose();
    _page.dispose();
    super.dispose();
  }

  Future<void> _verifyNin() async {
    if (_nin.text.length != 11) {
      setState(() => _error = 'NIN must be 11 digits');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _api.verifyNin(_nin.text.trim());
      setState(() {
        _ninData = data;
        _name.text = data['name']?.toString() ?? '';
        _dob.text = data['dob']?.toString() ?? '';
        _address.text = data['address']?.toString() ?? '';
        _email.text = data['email']?.toString() ?? '';
        _step = 1;
      });
      _page.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _saveProfile() async {
    setState(() { _loading = true; _error = null; });
    try {
      await _api.saveProfile(
        nin: _nin.text.trim(),
        name: _name.text.trim(),
        dob: _dob.text.trim(),
        address: _address.text.trim(),
        phone: _phone.text.trim(),
        email: _email.text.trim().isEmpty ? null : _email.text.trim(),
      );
      setState(() => _step = 2);
      _page.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDoc(String docType) async {
    final file = await _picker.pickImage(source: ImageSource.camera, imageQuality: 60);
    if (file == null) return;
    final bytes = await file.readAsBytes();
    final b64 = 'data:image/jpeg;base64,${base64Encode(bytes)}';
    setState(() => _loading = true);
    try {
      await _api.uploadDocument(docType: docType, fileData: b64);
      setState(() => _uploads[docType] = b64);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _submit() async {
    if (!_uploads.containsKey('SELFIE')) {
      setState(() => _error = 'Selfie is required');
      return;
    }
    if (widget.isDriver) {
      for (final t in ['DRIVERS_LICENSE', 'POLICE_CLEARANCE', 'DSS_CLEARANCE']) {
        if (!_uploads.containsKey(t)) {
          setState(() => _error = 'Upload all required documents');
          return;
        }
      }
    }
    setState(() { _loading = true; _error = null; });
    try {
      await _api.submitOnboarding();
      widget.onComplete();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.isDriver ? 'Driver registration' : 'Rider registration'),
      ),
      body: Column(
        children: [
          LinearProgressIndicator(value: (_step + 1) / (widget.isDriver ? 4 : 3)),
          if (_error != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              color: Brand.error.withValues(alpha: 0.15),
              child: Text(_error!, style: const TextStyle(color: Brand.error)),
            ),
          Expanded(
            child: PageView(
              controller: _page,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                _ninStep(),
                _profileStep(),
                _docsStep(driverOnly: false),
                if (widget.isDriver) _docsStep(driverOnly: true),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _ninStep() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Step 1 — Verify NIN', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            __DEV__
                ? 'We verify your NIN with NIMC. Sandbox NINs for testing: 12345678901, 98765432109'
                : 'We verify your NIN with NIMC to confirm your identity.',
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _nin,
            keyboardType: TextInputType.number,
            maxLength: 11,
            decoration: const InputDecoration(labelText: 'National ID Number (NIN)'),
          ),
          const Spacer(),
          ElevatedButton(
            onPressed: _loading ? null : _verifyNin,
            child: Text(_loading ? 'Verifying with NIMC…' : 'Verify NIN'),
          ),
        ],
      ),
    );
  }

  Widget _profileStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Step 2 — Your details', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          if (_ninData != null) ...[
            const SizedBox(height: 8),
            Text('NIMC verified ✓', style: TextStyle(color: Brand.success)),
          ],
          const SizedBox(height: 16),
          TextField(controller: _name, decoration: const InputDecoration(labelText: 'Full name')),
          const SizedBox(height: 12),
          TextField(controller: _dob, decoration: const InputDecoration(labelText: 'Date of birth')),
          const SizedBox(height: 12),
          TextField(controller: _address, maxLines: 2, decoration: const InputDecoration(labelText: 'Address')),
          const SizedBox(height: 12),
          TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone')),
          const SizedBox(height: 12),
          TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email (optional)')),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loading ? null : _saveProfile,
            child: Text(_loading ? 'Saving…' : 'Continue'),
          ),
        ],
      ),
    );
  }

  Widget _docsStep({required bool driverOnly}) {
    if (driverOnly) {
      return SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Step 4 — Clearance documents', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _docButton('DRIVERS_LICENSE', "Driver's licence"),
            _docButton('POLICE_CLEARANCE', 'Police clearance'),
            _docButton('DSS_CLEARANCE', 'DSS clearance'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: Text(_loading ? 'Submitting…' : 'Submit for approval'),
            ),
          ],
        ),
      );
    }
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(widget.isDriver ? 'Step 3 — Selfie' : 'Step 3 — Selfie & finish', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _docButton('SELFIE', 'Take selfie'),
          if (!widget.isDriver) ...[
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: Text(_loading ? 'Finishing…' : 'Complete registration'),
            ),
          ] else ...[
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : () {
                setState(() => _step = 3);
                _page.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
              },
              child: const Text('Continue to documents'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _docButton(String type, String label) {
    final done = _uploads.containsKey(type);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: OutlinedButton.icon(
        onPressed: _loading ? null : () => _pickDoc(type),
        icon: Icon(done ? Icons.check_circle : Icons.upload_file, color: done ? Brand.success : null),
        label: Text(done ? '$label uploaded' : label),
      ),
    );
  }
}

/// Basic account creation before NIN onboarding.
class RegisterAccountScreen extends StatefulWidget {
  const RegisterAccountScreen({super.key, required this.isDriver, required this.onRegistered});

  final bool isDriver;
  final void Function(String token) onRegistered;

  @override
  State<RegisterAccountScreen> createState() => _RegisterAccountScreenState();
}

class _RegisterAccountScreenState extends State<RegisterAccountScreen> {
  final _phone = TextEditingController(text: '+234');
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _name = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_password.text != _confirm.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final api = ApiClient();
      final data = await api.register(
        phone: _phone.text.trim(),
        password: _password.text,
        name: _name.text.trim().isEmpty ? (widget.isDriver ? 'Driver' : 'Rider') : _name.text.trim(),
        role: widget.isDriver ? 'DRIVER' : 'RIDER',
      );
      final token = data['token'] as String;
      widget.onRegistered(token);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.isDriver ? 'Create driver account' : 'Create rider account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            if (_error != null) Text(_error!, style: const TextStyle(color: Brand.error)),
            TextField(controller: _name, decoration: const InputDecoration(labelText: 'Display name')),
            const SizedBox(height: 12),
            TextField(controller: _phone, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone')),
            const SizedBox(height: 12),
            PasswordField(controller: _password, label: 'Password'),
            const SizedBox(height: 12),
            PasswordField(controller: _confirm, label: 'Confirm password'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: Text(_loading ? 'Creating…' : 'Continue to NIN verification'),
            ),
          ],
        ),
      ),
    );
  }
}
