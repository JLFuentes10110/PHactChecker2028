// ─────────────────────────────────────────────
//  PH-FC-2028 · Flutter API service
//  lib/services/api_service.dart
// ─────────────────────────────────────────────

import 'dart:convert';
import 'package:http/http.dart' as http;

// ── Config ─────────────────────────────────────

const _base = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2:8000', // Android emulator → localhost
);

// ── Enums ──────────────────────────────────────

enum VerdictTag {
  trueTag,
  mostlyTrue,
  misleading,
  falseTag,
  unverifiable,
  creditGrab,
}

extension VerdictTagExt on VerdictTag {
  String get apiValue => const {
    VerdictTag.trueTag:      'true',
    VerdictTag.mostlyTrue:   'mostly_true',
    VerdictTag.misleading:   'misleading',
    VerdictTag.falseTag:     'false',
    VerdictTag.unverifiable: 'unverifiable',
    VerdictTag.creditGrab:   'credit_grab',
  }[this]!;

  String get label => const {
    VerdictTag.trueTag:      'True',
    VerdictTag.mostlyTrue:   'Mostly true',
    VerdictTag.misleading:   'Misleading',
    VerdictTag.falseTag:     'False',
    VerdictTag.unverifiable: 'Unverifiable',
    VerdictTag.creditGrab:   'Credit grab',
  }[this]!;

  static VerdictTag fromString(String s) => const {
    'true':         VerdictTag.trueTag,
    'mostly_true':  VerdictTag.mostlyTrue,
    'misleading':   VerdictTag.misleading,
    'false':        VerdictTag.falseTag,
    'unverifiable': VerdictTag.unverifiable,
    'credit_grab':  VerdictTag.creditGrab,
  }[s] ?? VerdictTag.unverifiable;
}

// ── Models ─────────────────────────────────────

class Claim {
  final String id;
  final String rawText;
  final String source;
  final String? sourceUrl;
  final String language;
  final String status;
  final DateTime createdAt;

  const Claim({
    required this.id,
    required this.rawText,
    required this.source,
    this.sourceUrl,
    required this.language,
    required this.status,
    required this.createdAt,
  });

  factory Claim.fromJson(Map<String, dynamic> j) => Claim(
    id:        j['id'] as String,
    rawText:   j['raw_text'] as String,
    source:    j['source'] as String,
    sourceUrl: j['source_url'] as String?,
    language:  j['language'] as String? ?? 'tl',
    status:    j['status'] as String,
    createdAt: DateTime.parse(j['created_at'] as String),
  );
}

class Verdict {
  final String id;
  final String claimId;
  final VerdictTag tag;
  final double confidence;
  final String? explanation;
  final String? reviewedBy;
  final DateTime createdAt;

  const Verdict({
    required this.id,
    required this.claimId,
    required this.tag,
    required this.confidence,
    this.explanation,
    this.reviewedBy,
    required this.createdAt,
  });

  factory Verdict.fromJson(Map<String, dynamic> j) => Verdict(
    id:          j['id'] as String,
    claimId:     j['claim_id'] as String,
    tag:         VerdictTagExt.fromString(j['tag'] as String),
    confidence:  (j['confidence'] as num).toDouble(),
    explanation: j['explanation'] as String?,
    reviewedBy:  j['reviewed_by'] as String?,
    createdAt:   DateTime.parse(j['created_at'] as String),
  );
}

// ── API service ────────────────────────────────

class ApiService {
  static final _client = http.Client();
  static const _headers = {'Content-Type': 'application/json'};

  static Future<T> _get<T>(String path, T Function(dynamic) parse) async {
    final res = await _client.get(Uri.parse('$_base$path'), headers: _headers);
    if (res.statusCode != 200) throw Exception('HTTP ${res.statusCode}');
    return parse(jsonDecode(res.body));
  }

  static Future<T> _post<T>(String path, Map<String, dynamic> body, T Function(dynamic) parse) async {
    final res = await _client.post(
      Uri.parse('$_base$path'),
      headers: _headers,
      body: jsonEncode(body),
    );
    if (res.statusCode != 201 && res.statusCode != 200) {
      throw Exception('HTTP ${res.statusCode}');
    }
    return parse(jsonDecode(res.body));
  }

  // Claims
  static Future<List<Claim>> listClaims({int skip = 0, int limit = 20}) =>
    _get('/api/v1/claims/?skip=$skip&limit=$limit',
      (j) => (j as List).map((e) => Claim.fromJson(e as Map<String, dynamic>)).toList());

  static Future<Claim> submitClaim({
    required String rawText,
    String source = 'manual',
    String language = 'tl',
    String? sourceUrl,
  }) =>
    _post('/api/v1/claims/', {
      'raw_text': rawText,
      'source': source,
      'language': language,
      if (sourceUrl != null) 'source_url': sourceUrl,
    }, (j) => Claim.fromJson(j as Map<String, dynamic>));

  // Verdicts
  static Future<List<Verdict>> verdictsForClaim(String claimId) =>
    _get('/api/v1/verdicts/claim/$claimId',
      (j) => (j as List).map((e) => Verdict.fromJson(e as Map<String, dynamic>)).toList());

  static Future<Verdict> createVerdict({
    required String claimId,
    required VerdictTag tag,
    required double confidence,
    String? explanation,
    String? reviewedBy,
  }) =>
    _post('/api/v1/verdicts/', {
      'claim_id':    claimId,
      'tag':         tag.apiValue,
      'confidence':  confidence,
      if (explanation != null) 'explanation': explanation,
      if (reviewedBy != null) 'reviewed_by': reviewedBy,
    }, (j) => Verdict.fromJson(j as Map<String, dynamic>));
}
