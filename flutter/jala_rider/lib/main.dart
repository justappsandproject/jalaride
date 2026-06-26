import 'package:flutter/material.dart';
import '../services/session.dart';
import '../theme/app_theme.dart';
import 'screens/auth_screen.dart';
import 'screens/home_screen.dart';
import 'screens/tabs_screens.dart';
import 'screens/welcome_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const JalaRiderApp());
}

class JalaRiderApp extends StatelessWidget {
  const JalaRiderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Jala Ride',
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
    return RiderShell(token: _token!, onLogout: _logout);
  }
}

class RiderShell extends StatefulWidget {
  const RiderShell({super.key, required this.token, required this.onLogout});

  final String token;
  final VoidCallback onLogout;

  @override
  State<RiderShell> createState() => _RiderShellState();
}

class _RiderShellState extends State<RiderShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeScreen(token: widget.token),
      TripsScreen(token: widget.token),
      const WalletScreen(),
      AccountScreen(onLogout: widget.onLogout),
    ];
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: Brand.primary, borderRadius: BorderRadius.circular(8)),
              child: const Text('JR', style: TextStyle(fontWeight: FontWeight.bold, color: Brand.accent, fontSize: 12)),
            ),
            const SizedBox(width: 10),
            const Text('Jala Ride'),
          ],
        ),
      ),
      body: pages[_index],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: Brand.surface,
        indicatorColor: Brand.primary.withValues(alpha: 0.3),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.history), label: 'Trips'),
          NavigationDestination(icon: Icon(Icons.account_balance_wallet_outlined), label: 'Wallet'),
          NavigationDestination(icon: Icon(Icons.person_outline), label: 'Account'),
        ],
      ),
    );
  }
}
