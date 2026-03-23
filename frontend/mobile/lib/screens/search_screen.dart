// ─────────────────────────────────────────────
//  PH-FC-2028 · Flutter Search screen
//  lib/screens/search_screen.dart
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../widgets/badges.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _ctrl = TextEditingController();
  List<({Claim claim, Verdict? verdict})> _all = [];
  List<({Claim claim, Verdict? verdict})> _filtered = [];
  String _verdictFilter = 'all';
  String _sourceFilter  = 'all';
  bool _loading = false;

  static const _verdictFilters = [
    ('All',          'all'),
    ('False',        'false'),
    ('Misleading',   'misleading'),
    ('Credit grab',  'credit_grab'),
    ('True',         'true'),
    ('Mostly true',  'mostly_true'),
    ('Unverifiable', 'unverifiable'),
  ];

  static const _sourceFilters = [
    ('All',      'all'),
    ('Facebook', 'facebook'),
    ('TikTok',   'tiktok'),
    ('Twitter',  'twitter'),
    ('YouTube',  'youtube'),
    ('News',     'news'),
  ];

  @override
  void initState() {
    super.initState();
    _loadAll();
    _ctrl.addListener(_applyFilters);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    try {
      final claims = await ApiService.listClaims(skip: 0, limit: 100);
      final enriched = await Future.wait(
        claims.map((c) async {
          final v = await ApiService.verdictsForClaim(c.id).onError((_, __) => []);
          return (claim: c, verdict: v.firstOrNull);
        }),
      );
      setState(() { _all = enriched; });
      _applyFilters();
    } finally {
      setState(() => _loading = false);
    }
  }

  void _applyFilters() {
    final q = _ctrl.text.toLowerCase();
    setState(() {
      _filtered = _all.where((item) {
        final matchText   = q.isEmpty || item.claim.rawText.toLowerCase().contains(q);
        final matchSource = _sourceFilter  == 'all' || item.claim.source == _sourceFilter;
        final matchVerdict = _verdictFilter == 'all' || item.verdict?.tag.apiValue == _verdictFilter;
        return matchText && matchSource && matchVerdict;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Claim Search')),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: TextField(
              controller: _ctrl,
              decoration: InputDecoration(
                hintText: 'Search in Filipino or English…',
                hintStyle: const TextStyle(fontSize: 13, color: Color(0xFFB4B2A9)),
                prefixIcon: const Icon(Icons.search, size: 18, color: Color(0xFFB4B2A9)),
                filled: true,
                fillColor: Colors.white,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFE8E5E0)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFFE8E5E0)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: Color(0xFF888780)),
                ),
              ),
            ),
          ),

          // Verdict filter chips
          _FilterRow(
            filters: _verdictFilters,
            selected: _verdictFilter,
            onSelect: (v) { setState(() => _verdictFilter = v); _applyFilters(); },
          ),

          // Source filter chips
          _FilterRow(
            filters: _sourceFilters,
            selected: _sourceFilter,
            onSelect: (v) { setState(() => _sourceFilter = v); _applyFilters(); },
          ),

          // Result count
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                _loading ? 'Loading…' : '${_filtered.length} result${_filtered.length != 1 ? "s" : ""}',
                style: const TextStyle(fontSize: 11, color: Color(0xFF888780), fontFamily: 'DMSans'),
              ),
            ),
          ),

          // Results list
          Expanded(
            child: _loading
              ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
              : _filtered.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('○', style: TextStyle(fontSize: 40, color: Color(0xFFD3D1C7))),
                        SizedBox(height: 8),
                        Text('No claims found', style: TextStyle(fontSize: 13, color: Color(0xFFB4B2A9), fontFamily: 'DMSans')),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                    itemCount: _filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (ctx, i) {
                      final item = _filtered[i];
                      return _SearchResultCard(claim: item.claim, verdict: item.verdict);
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _FilterRow extends StatelessWidget {
  final List<(String, String)> filters;
  final String selected;
  final ValueChanged<String> onSelect;

  const _FilterRow({required this.filters, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 34,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: filters.map(((String label, String value) f) {
          final active = selected == f.$2;
          return Padding(
            padding: const EdgeInsets.only(right: 6),
            child: GestureDetector(
              onTap: () => onSelect(f.$2),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: active ? const Color(0xFF0F0F0D) : Colors.white,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: active ? const Color(0xFF0F0F0D) : const Color(0xFFE8E5E0),
                  ),
                ),
                child: Text(
                  f.$1,
                  style: TextStyle(
                    fontSize: 11,
                    fontFamily: 'DMSans',
                    fontWeight: FontWeight.w500,
                    color: active ? Colors.white : const Color(0xFF888780),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _SearchResultCard extends StatelessWidget {
  final Claim claim;
  final Verdict? verdict;

  const _SearchResultCard({required this.claim, this.verdict});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFF0EDE8)),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SourceBadge(source: claim.source),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                decoration: BoxDecoration(color: const Color(0xFFF1EFE8), borderRadius: BorderRadius.circular(3)),
                child: Text(claim.language, style: const TextStyle(fontSize: 10, color: Color(0xFF888780))),
              ),
              const Spacer(),
              Text(
                '#${claim.id.substring(0, 8)}',
                style: const TextStyle(fontSize: 10, color: Color(0xFFD3D1C7), fontFamily: 'DMSans'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            claim.rawText,
            style: const TextStyle(fontSize: 13, height: 1.5, color: Color(0xFF1a1a18)),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 10),
          if (verdict != null)
            Row(children: [
              VerdictChip(tag: verdict!.tag, confidence: verdict!.confidence),
              const SizedBox(width: 8),
              ConfidenceBar(value: verdict!.confidence, tag: verdict!.tag),
            ])
          else
            const VerdictChip(tag: VerdictTag.unverifiable),
        ],
      ),
    );
  }
}
