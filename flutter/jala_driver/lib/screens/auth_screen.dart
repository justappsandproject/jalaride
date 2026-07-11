import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';
import '../widgets/password_field.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.onAuthenticated, this.onRegister});

  final VoidCallback onAuthenticated;
  final VoidCallback? onRegister;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _phone = TextEditingController(text: '+234');
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _name = TextEditingController();
  bool _register = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_register && _password.text != _confirmPassword.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    if (_register && _password.text.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters');
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = ApiClient();
      final Map<String, dynamic> data;
      if (_register) {
        data = await api.register(
          phone: _phone.text.trim(),
          password: _password.text,
          name: _name.text.trim(),
        );
      } else {
        data = await api.login(_phone.text.trim(), _password.text);
      }
      final token = data['token'] as String;
      final user = data['user'] as Map<String, dynamic>;
      await Session.save(token, user['name'] as String? ?? 'Driver');
      if (mounted) widget.onAuthenticated();
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
        title: Text(_register ? 'Driver registration' : 'Driver sign in'),
        backgroundColor: Brand.background,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Image.asset('assets/branding/logo-mark.png', height: 72),
            ),
            const SizedBox(height: 8),
            Text(
              _register ? 'Become a Jala Driver' : 'Driver dashboard',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Brand.accent),
            ),
            const SizedBox(height: 4),
            Text(
              'Fleet vehicles · weekly remittance · clearance verified',
              textAlign: TextAlign.center,
              style: TextStyle(color: Brand.textSecondary),
            ),
            const SizedBox(height: 24),
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Brand.error.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(_error!, style: const TextStyle(color: Brand.error)),
              ),
            if (_register)
              TextField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'Full name'),
              ),
            if (_register) const SizedBox(height: 16),
            TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone number'),
            ),
            const SizedBox(height: 16),
            PasswordField(controller: _password, label: 'Password'),
            if (_register) ...[
              const SizedBox(height: 16),
              PasswordField(
                controller: _confirmPassword,
                label: 'Confirm password',
                textInputAction: TextInputAction.done,
              ),
            ],
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(backgroundColor: Brand.accent, foregroundColor: Brand.background),
              child: Text(_loading ? 'Connecting to server…' : (_register ? 'Register as driver' : 'Sign in')),
            ),
            TextButton(
              onPressed: () {
                if (widget.onRegister != null && !_register) {
                  widget.onRegister!();
                } else {
                  setState(() {
                    _register = !_register;
                    _error = null;
                    _confirmPassword.clear();
                  });
                }
              },
              child: Text(_register ? 'Already registered? Sign in' : 'New driver? Register'),
            ),
          ],
        ),
      ),
    );
  }
}
