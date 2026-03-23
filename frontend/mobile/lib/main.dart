// ─────────────────────────────────────────────
//  PH-FC-2028 · Flutter Mobile App
//  lib/main.dart — entry point
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'screens/feed_screen.dart';
import 'screens/search_screen.dart';
import 'screens/submit_screen.dart';
import 'screens/dashboard_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  runApp(const PhFcApp());
}

class PhFcApp extends StatelessWidget {
  const PhFcApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "TamaKaya '28",
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFE24B4A),
          brightness: Brightness.light,
        ),
        fontFamily: 'DMSans',
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F0F0D),
          foregroundColor: Colors.white,
          elevation: 0,
          titleTextStyle: TextStyle(
            fontFamily: 'Syne',
            fontWeight: FontWeight.w700,
            fontSize: 16,
            color: Colors.white,
          ),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Color(0xFF0F0F0D),
          selectedItemColor: Color(0xFFE24B4A),
          unselectedItemColor: Color(0xFF888780),
          type: BottomNavigationBarType.fixed,
        ),
      ),
      home: const RootShell(),
    );
  }
}

class RootShell extends StatefulWidget {
  const RootShell({super.key});
  @override
  State<RootShell> createState() => _RootShellState();
}

class _RootShellState extends State<RootShell> {
  int _idx = 0;

  final _screens = const [
    FeedScreen(),
    SearchScreen(),
    SubmitScreen(),
    DashboardScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _idx, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _idx,
        onTap: (i) => setState(() => _idx = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.feed_outlined),      label: 'Feed'),
          BottomNavigationBarItem(icon: Icon(Icons.search),             label: 'Search'),
          BottomNavigationBarItem(icon: Icon(Icons.add_circle_outline), label: 'Submit'),
          BottomNavigationBarItem(icon: Icon(Icons.bar_chart_outlined), label: 'Dashboard'),
        ],
      ),
    );
  }
}
