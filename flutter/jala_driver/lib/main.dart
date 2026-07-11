import 'package:flutter/material.dart';
import 'services/api_client.dart';
import 'services/session.dart';
import 'theme/app_theme.dart';
import 'screens/account_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/driver_active_ride_screen.dart';
import 'screens/driver_screens.dart';
import 'screens/onboarding_screen.dart';
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
  String? _registrationStatus;
  bool _loading = true;
  bool _showWelcome = true;
  bool _registering = false;

  @override
  void initState() {
    super.initState();
    _boot();
  }

  Future<void> _boot() async {
    final token = await Session.loadToken();
    String? status;
    if (token != null) {
      try {
        final me = await ApiClient(token: token).onboardingStatus();
        status = me['registrationStatus'] as String?;
      } catch (_) {
        status = 'APPROVED';
      }
    }
    setState(() {
      _token = token;
      _registrationStatus = status;
      _loading = false;
      _showWelcome = token == null;
    });
  }

  Future<void> _logout() async {
    await Session.clear();
    setState(() {
      _token = null;
      _registrationStatus = null;
      _showWelcome = true;
      _registering = false;
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
      if (_registering) {
        return RegisterAccountScreen(
          isDriver: true,
          onRegistered: (token) async {
            await Session.save(token, 'Driver');
            setState(() { _token = token; _registering = false; _registrationStatus = 'NIN_PENDING'; });
          },
        );
      }
      return AuthScreen(
        onAuthenticated: _boot,
        onRegister: () => setState(() => _registering = true),
      );
    }
    if (_registrationStatus != 'APPROVED') {
      if (_registrationStatus == 'AWAITING_APPROVAL') {
        return PendingApprovalScreen(onLogout: _logout);
      }
      return OnboardingScreen(token: _token!, isDriver: true, onComplete: _boot);
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
  void initState() {
    super.initState();
    _checkActive();
  }

  Future<void> _checkActive() async {
    final ride = await ApiClient(token: widget.token).activeRide();
    if (mounted && ride != null) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => DriverActiveRideScreen(token: widget.token)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      DriverHomeScreen(token: widget.token),
      EarningsScreen(token: widget.token),
      const RemittanceScreen(),
      DriverAccountScreen(onLogout: widget.onLogout),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Image.asset('assets/branding/logo-mark.png', height: 28),
            const SizedBox(width: 10),
            const Text('Jala Ride Driver'),
          ],
        ),
      ),
      body: pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.payments_outlined), label: 'Earnings'),
          NavigationDestination(icon: Icon(Icons.receipt_long), label: 'Remit'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Account'),
        ],
      ),
    );
  }
}
