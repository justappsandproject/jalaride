import 'package:flutter/material.dart';
import '../services/api_client.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key, required this.onAuthenticated});

  final VoidCallback onAuthenticated;

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _phone = TextEditingController(text: '+234');
  final _password = TextEditingController();
  final _name = TextEditingController();
  bool _register = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _phone.dispose();
    _password.dispose();
    _name.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
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
      await Session.save(token, user['name'] as String? ?? 'Rider');
      if (mounted) widget.onAuthenticated();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_register ? 'Create account' : 'Sign in')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
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
                decoration: const InputDecoration(labelText: 'Full name'),
              ),
            if (_register) const SizedBox(height: 16),
            TextField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone number'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: Text(_loading ? 'Please wait…' : (_register ? 'Register' : 'Sign in')),
            ),
            TextButton(
              onPressed: () => setState(() => _register = !_register),
              child: Text(_register ? 'Already have an account? Sign in' : 'New rider? Register'),
            ),
          ],
        ),
      ),
    );
  }
}
