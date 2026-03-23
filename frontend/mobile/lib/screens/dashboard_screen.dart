// ─────────────────────────────────────────────
//  PH-FC-2028 · Flutter Dashboard screen
//  lib/screens/dashboard_screen.dart
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../services/api_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  int _total = 0;
  int _verified = 0;
  int _falseCount = 0;
  int _creditGrabs = 0;
  Map<String, int> _byVerdict = {};
  Map<String, int> _bySource  = {};

  static const _verdictColors = {
    'true':         Color(0xFF639922),
    'mostly_true':  Color(0xFF97C459),
    'misleading':   Color(0xFFBA7517),
    'false':        Color(0xFFE24B4A),
    'credit_grab':  Color(0xFFD85A30),
    'unverifiable': Color(0xFFB4B2A9),
  };

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final claims = await ApiService.listClaims(skip: 0, limit: 100);
      final verdicts = (await Future.wait(
        claims.take(30).map((c) => ApiService.verdictsForClaim(c.id).onError((_, __) => [])),
      )).expand((v) => v).toList();

      final verdictMap = <String, List<Verdict>>{};
      for (final v in verdicts) {
        (verdictMap[v.claimId] ??= []).add(v);
      }

      int verified = 0, falseC = 0, creditG = 0;
      final byVerdict = <String, int>{};
      final bySource  = <String, int>{};

      for (final c in claims) {
        bySource[c.source] = (bySource[c.source] ?? 0) + 1;
        final latest = verdictMap[c.id]?.firstOrNull;
        if (latest != null) {
          final tag = latest.tag.apiValue;
          byVerdict[tag] = (byVerdict[tag] ?? 0) + 1;
          if (tag == 'true' || tag == 'mostly_true') verified++;
          if (tag == 'false') falseC++;
          if (tag == 'credit_grab') creditG++;
        }
      }

      setState(() {
        _total       = claims.length;
        _verified    = verified;
        _falseCount  = falseC;
        _creditGrabs = creditG;
        _byVerdict   = byVerdict;
        _bySource    = bySource;
        _loading     = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh, size: 18)),
        ],
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
        : RefreshIndicator(
            onRefresh: _load,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Metric cards
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.6,
                  children: [
                    _MetricCard(label: 'Total claims',    value: _total,       color: const Color(0xFF1a1a18)),
                    _MetricCard(label: 'Verified',        value: _verified,    color: const Color(0xFF639922)),
                    _MetricCard(label: 'False / misinfo', value: _falseCount,  color: const Color(0xFFE24B4A)),
                    _MetricCard(label: 'Credit grabs',    value: _creditGrabs, color: const Color(0xFFD85A30)),
                  ],
                ),
                const SizedBox(height: 20),

                // Verdict distribution
                _SectionLabel('Verdict distribution'),
                const SizedBox(height: 10),
                _VerdictBar(byVerdict: _byVerdict, total: _total),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 6,
                  children: _verdictColors.entries.map((e) {
                    final count = _byVerdict[e.key] ?? 0;
                    final pct   = _total > 0 ? (count / _total * 100).round() : 0;
                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(width: 8, height: 8, decoration: BoxDecoration(color: e.value, borderRadius: BorderRadius.circular(2))),
                        const SizedBox(width: 4),
                        Text(
                          '${e.key.replaceAll('_', ' ')} $pct%',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF888780), fontFamily: 'DMSans'),
                        ),
                      ],
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // Source breakdown
                _SectionLabel('Claims by source'),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFF0EDE8)),
                  ),
                  child: Column(
                    children: _bySource.entries
                      .toList()
                      ..sort((a, b) => b.value.compareTo(a.value)),
                  ).children.asMap().entries.map((e) {
                    final entry = (_bySource.entries.toList()
                      ..sort((a, b) => b.value.compareTo(a.value)))[e.key];
                    final pct = _total > 0 ? entry.value / _total : 0.0;
                    final isLast = e.key == _bySource.length - 1;
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        border: isLast ? null : const Border(bottom: BorderSide(color: Color(0xFFF5F3F0))),
                      ),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 70,
                            child: Text(
                              entry.key,
                              style: const TextStyle(fontSize: 12, fontFamily: 'DMSans', color: Color(0xFF5F5E5A)),
                            ),
                          ),
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(2),
                              child: LinearProgressIndicator(
                                value: pct.toDouble(),
                                color: const Color(0xFF888780),
                                backgroundColor: const Color(0xFFF1EFE8),
                                minHeight: 4,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            '${entry.value}',
                            style: const TextStyle(fontSize: 11, color: Color(0xFFB4B2A9), fontFamily: 'DMSans'),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _MetricCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF1EFE8),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(fontSize: 9, color: Color(0xFF888780), fontFamily: 'DMSans', letterSpacing: 0.6),
          ),
          const SizedBox(height: 6),
          Text(
            value.toString(),
            style: TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: color, fontFamily: 'DMSans'),
          ),
        ],
      ),
    );
  }
}

class _VerdictBar extends StatelessWidget {
  final Map<String, int> byVerdict;
  final int total;

  static const _colors = {
    'true':         Color(0xFF639922),
    'mostly_true':  Color(0xFF97C459),
    'misleading':   Color(0xFFBA7517),
    'false':        Color(0xFFE24B4A),
    'credit_grab':  Color(0xFFD85A30),
    'unverifiable': Color(0xFFB4B2A9),
  };

  const _VerdictBar({required this.byVerdict, required this.total});

  @override
  Widget build(BuildContext context) {
    if (total == 0) return const SizedBox.shrink();
    return ClipRRect(
      borderRadius: BorderRadius.circular(4),
      child: Row(
        children: _colors.entries.map((e) {
          final count = byVerdict[e.key] ?? 0;
          final pct   = count / total;
          return pct > 0
            ? Flexible(flex: (pct * 1000).round(), child: Container(height: 10, color: e.value))
            : const SizedBox.shrink();
        }).toList(),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);
  @override
  Widget build(BuildContext context) => Text(
    text.toUpperCase(),
    style: const TextStyle(fontSize: 10, color: Color(0xFF888780), fontFamily: 'DMSans', letterSpacing: 0.8, fontWeight: FontWeight.w500),
  );
}
