// ─────────────────────────────────────────────
//  PH-FC-2028 · Flutter Feed screen
//  lib/screens/feed_screen.dart
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/badges.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});
  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final List<({Claim claim, Verdict? verdict})> _items = [];
  bool _loading = false;
  int _page = 0;
  static const _pageSize = 10;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (_loading) return;
    setState(() => _loading = true);
    try {
      final claims = await ApiService.listClaims(skip: _page * _pageSize, limit: _pageSize);
      final enriched = await Future.wait(
        claims.map((c) async {
          final verdicts = await ApiService.verdictsForClaim(c.id).onError((_, __) => []);
          return (claim: c, verdict: verdicts.firstOrNull);
        }),
      );
      setState(() {
        _items.addAll(enriched);
        _page++;
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  String _relativeTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24)   return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("TamaKaya '28"),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: Center(
              child: Text(
                'FACT-CHECK FEED',
                style: TextStyle(
                  fontSize: 9,
                  fontFamily: 'DMSans',
                  letterSpacing: 1.2,
                  color: Colors.white.withOpacity(0.4),
                ),
              ),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          setState(() { _items.clear(); _page = 0; });
          await _load();
        },
        child: ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: _items.length + 1,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (ctx, i) {
            if (i == _items.length) {
              return _loading
                ? const Center(child: Padding(
                    padding: EdgeInsets.all(16),
                    child: CircularProgressIndicator(strokeWidth: 2)))
                : TextButton(
                    onPressed: _load,
                    child: const Text('Load more'),
                  );
            }
            final item = _items[i];
            return _ClaimCard(claim: item.claim, verdict: item.verdict, relTime: _relativeTime(item.claim.createdAt));
          },
        ),
      ),
    );
  }
}

class _ClaimCard extends StatelessWidget {
  final Claim claim;
  final Verdict? verdict;
  final String relTime;

  const _ClaimCard({required this.claim, this.verdict, required this.relTime});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF0EDE8)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Meta
          Row(
            children: [
              SourceBadge(source: claim.source),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1EFE8),
                  borderRadius: BorderRadius.circular(3),
                ),
                child: Text(claim.language, style: const TextStyle(fontSize: 10, color: Color(0xFF888780), fontFamily: 'DMSans')),
              ),
              const Spacer(),
              Text(relTime, style: const TextStyle(fontSize: 10, color: Color(0xFFB4B2A9), fontFamily: 'DMSans')),
            ],
          ),
          const SizedBox(height: 10),
          // Text
          Text(claim.rawText, style: const TextStyle(fontSize: 13, height: 1.5, color: Color(0xFF1a1a18))),
          const SizedBox(height: 12),
          // Verdict
          if (verdict != null) ...[
            VerdictChip(tag: verdict!.tag, confidence: verdict!.confidence),
            if (verdict!.confidence > 0) ...[
              const SizedBox(height: 6),
              ConfidenceBar(value: verdict!.confidence, tag: verdict!.tag),
            ],
            if (verdict!.explanation != null) ...[
              const SizedBox(height: 6),
              Text(verdict!.explanation!, style: const TextStyle(fontSize: 11, color: Color(0xFF888780), height: 1.4)),
            ],
          ] else
            const VerdictChip(tag: VerdictTag.unverifiable),
        ],
      ),
    );
  }
}
