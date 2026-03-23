// ─────────────────────────────────────────────
//  PH-FC-2028 · Flutter badge widgets
//  lib/widgets/badges.dart
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../services/api_service.dart';

// ── Verdict chip ───────────────────────────────

class VerdictChip extends StatelessWidget {
  final VerdictTag tag;
  final double? confidence;

  const VerdictChip({super.key, required this.tag, this.confidence});

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _colors(tag);
    final conf = confidence;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: fg.withOpacity(0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            tag.label,
            style: TextStyle(
              fontSize: 11,
              fontFamily: 'DMSans',
              fontWeight: FontWeight.w500,
              color: fg,
            ),
          ),
          if (conf != null && conf > 0) ...[
            const SizedBox(width: 4),
            Text(
              '${(conf * 100).round()}%',
              style: TextStyle(fontSize: 10, color: fg.withOpacity(0.6), fontFamily: 'DMSans'),
            ),
          ]
        ],
      ),
    );
  }

  (Color, Color) _colors(VerdictTag tag) => switch (tag) {
    VerdictTag.trueTag      => (const Color(0xFFEAF3DE), const Color(0xFF27500A)),
    VerdictTag.mostlyTrue   => (const Color(0xFFEAF3DE), const Color(0xFF3B6D11)),
    VerdictTag.misleading   => (const Color(0xFFFAEEDA), const Color(0xFF633806)),
    VerdictTag.falseTag     => (const Color(0xFFFCEBEB), const Color(0xFF501313)),
    VerdictTag.creditGrab   => (const Color(0xFFFAECE7), const Color(0xFF4A1B0C)),
    VerdictTag.unverifiable => (const Color(0xFFF1EFE8), const Color(0xFF5F5E5A)),
  };
}

// ── Source badge ───────────────────────────────

class SourceBadge extends StatelessWidget {
  final String source;
  const SourceBadge({super.key, required this.source});

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _colors(source);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: fg.withOpacity(0.2)),
      ),
      child: Text(
        source,
        style: TextStyle(fontSize: 10, fontFamily: 'DMSans', fontWeight: FontWeight.w500, color: fg),
      ),
    );
  }

  (Color, Color) _colors(String s) => switch (s) {
    'facebook' => (const Color(0xFFDCE8FF), const Color(0xFF185FA5)),
    'twitter'  => (const Color(0xFFE0F0FF), const Color(0xFF0F6494)),
    'tiktok'   => (const Color(0xFFFFE8F0), const Color(0xFF993556)),
    'youtube'  => (const Color(0xFFFFE8E8), const Color(0xFFE24B4A)),
    'news'     => (const Color(0xFFF1EFE8), const Color(0xFF5F5E5A)),
    _          => (const Color(0xFFEEEDFE), const Color(0xFF534AB7)),
  };
}

// ── Confidence bar ─────────────────────────────

class ConfidenceBar extends StatelessWidget {
  final double value;
  final VerdictTag tag;
  const ConfidenceBar({super.key, required this.value, required this.tag});

  Color get _color => switch (tag) {
    VerdictTag.trueTag      => const Color(0xFF639922),
    VerdictTag.mostlyTrue   => const Color(0xFF97C459),
    VerdictTag.misleading   => const Color(0xFFBA7517),
    VerdictTag.falseTag     => const Color(0xFFE24B4A),
    VerdictTag.creditGrab   => const Color(0xFFD85A30),
    VerdictTag.unverifiable => const Color(0xFFB4B2A9),
  };

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 64,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: value,
              color: _color,
              backgroundColor: const Color(0xFFE5E2DC),
              minHeight: 4,
            ),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          '${(value * 100).round()}%',
          style: const TextStyle(fontSize: 10, color: Color(0xFF888780), fontFamily: 'DMSans'),
        ),
      ],
    );
  }
}
