import 'package:flutter/material.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';
import 'screens/auth_screen.dart';
import 'screens/driver_screens.dart';
import 'screens/welcome_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const JalaDriverApp());
}

class JalaDriverApp extends StatelessWidget {
  const JalaDriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Jala Ride Driver',
      theme: AppTheme.dark,
      debugShowCheckedModeBanner: false,
      home: const AppGate(),
    );
  }
}

class AppGate extends StatefulWidget {
  const AppGate({super.key});

  @override
  State<AppGate> createState() => _AppGateState();
}

class _AppGateState extends State<AppGate> {
  String? _token;
  bool _loading = true;
  bool _showWelcome = true;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    final token = await Session.loadToken();
    setState(() {
      _token = token;
      _loading = false;
      _showWelcome = token == null;
    });
  }

  Future<void> _logout() async {
    await Session.clear();
    setState(() {
      _token = null;
      _showWelcome = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: Brand.primary)));
    }
    if (_token == null) {
      if (_showWelcome) {
        return WelcomeScreen(onGetStarted: () => setState(() => _showWelcome = false));
      }
      return AuthScreen(onAuthenticated: _boot);
    }
    return DriverShell(token: _token!, onLogout: _logout);
  }
}

class DriverShell extends StatefulWidget {
  const DriverShell({super.key, required this.token, required this.onLogout});

  final String token;
  final VoidCallback onLogout;

  @override
  State<DriverShell> createState() => _DriverShellState();
}

class _DriverShellState extends State<DriverShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      DriverHomeScreen(token: widget.token),
      const EarningsScreen(),
      const RemittanceScreen(),
      Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FutureBuilder<String?>(
              future: Session.loadName(),
              builder: (_, s) => Text(
                s.data ?? 'Driver',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
              ),
            ),
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: widget.onLogout,
              style: OutlinedButton.styleFrom(foregroundColor: Brand.error),
              child: const Text('Sign out'),
            ),
          ],
        ),
      ),
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Jala Ride Driver')),
      body: pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: Brand.surface,
        indicatorColor: Brand.primary.withValues(alpha: 0.3),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.payments_outlined), label: 'Earnings'),
          NavigationDestination(icon: Icon(Icons.receipt_long), label: 'Remit'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Account'),
        ],
      ),
    );
  }
}
