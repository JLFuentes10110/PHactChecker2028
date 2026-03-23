// ─────────────────────────────────────────────
//  PH-FC-2028 · Flutter Submit screen
//  lib/screens/submit_screen.dart
// ─────────────────────────────────────────────

import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SubmitScreen extends StatefulWidget {
  const SubmitScreen({super.key});
  @override
  State<SubmitScreen> createState() => _SubmitScreenState();
}

class _SubmitScreenState extends State<SubmitScreen> {
  final _textCtrl   = TextEditingController();
  final _urlCtrl    = TextEditingController();
  String _source    = 'manual';
  String _language  = 'tl';
  bool _submitting  = false;
  String? _successId;
  String? _error;

  static const _sources = [
    ('Manual entry', 'manual'),
    ('Facebook',     'facebook'),
    ('Twitter / X',  'twitter'),
    ('TikTok',       'tiktok'),
    ('YouTube',      'youtube'),
    ('News',         'news'),
  ];

  static const _langs = [
    ('Tagalog',  'tl'),
    ('English',  'en'),
    ('Cebuano',  'ceb'),
    ('Ilocano',  'ilo'),
  ];

  @override
  void dispose() {
    _textCtrl.dispose();
    _urlCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _textCtrl.text.trim();
    if (text.isEmpty) return;
    setState(() { _submitting = true; _successId = null; _error = null; });
    try {
      final claim = await ApiService.submitClaim(
        rawText:   text,
        source:    _source,
        language:  _language,
        sourceUrl: _urlCtrl.text.trim().isEmpty ? null : _urlCtrl.text.trim(),
      );
      setState(() { _successId = claim.id; });
      _textCtrl.clear();
      _urlCtrl.clear();
    } catch (e) {
      setState(() { _error = e.toString(); });
    } finally {
      setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Submit Claim')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Endpoint badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF1EFE8),
                borderRadius: BorderRadius.circular(5),
              ),
              child: const Text(
                'POST /api/v1/claims',
                style: TextStyle(fontFamily: 'DMSans', fontSize: 11, color: Color(0xFF888780)),
              ),
            ),
            const SizedBox(height: 20),

            // Claim text
            _Label('Claim text *'),
            const SizedBox(height: 6),
            TextField(
              controller: _textCtrl,
              maxLines: 5,
              decoration: _inputDeco('Paste claim in Filipino or English…'),
              style: const TextStyle(fontSize: 13),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: ValueListenableBuilder(
                valueListenable: _textCtrl,
                builder: (_, v, __) => Text(
                  '${v.text.trim().length} chars',
                  style: const TextStyle(fontSize: 10, color: Color(0xFFB4B2A9), fontFamily: 'DMSans'),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Source + Language row
            Row(
              children: [
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Label('Source platform'),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: _source,
                      decoration: _inputDeco(null),
                      style: const TextStyle(fontSize: 13, color: Color(0xFF1a1a18), fontFamily: 'DMSans'),
                      items: _sources.map(((String l, String v) s) =>
                        DropdownMenuItem(value: s.$2, child: Text(s.$1))).toList(),
                      onChanged: (v) => setState(() => _source = v ?? _source),
                    ),
                  ],
                )),
                const SizedBox(width: 12),
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _Label('Language'),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<String>(
                      value: _language,
                      decoration: _inputDeco(null),
                      style: const TextStyle(fontSize: 13, color: Color(0xFF1a1a18), fontFamily: 'DMSans'),
                      items: _langs.map(((String l, String v) s) =>
                        DropdownMenuItem(value: s.$2, child: Text('${s.$1} (${s.$2})'))).toList(),
                      onChanged: (v) => setState(() => _language = v ?? _language),
                    ),
                  ],
                )),
              ],
            ),
            const SizedBox(height: 16),

            // Source URL
            _Label('Source URL (optional)'),
            const SizedBox(height: 6),
            TextField(
              controller: _urlCtrl,
              keyboardType: TextInputType.url,
              decoration: _inputDeco('https://…'),
              style: const TextStyle(fontSize: 13),
            ),
            const SizedBox(height: 24),

            // Submit button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F0F0D),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  disabledBackgroundColor: const Color(0xFFD3D1C7),
                ),
                child: _submitting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Submit claim →', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
              ),
            ),
            const SizedBox(height: 16),

            // Success state
            if (_successId != null)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF3DE),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFC0DD97)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Claim submitted', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF27500A))),
                    const SizedBox(height: 4),
                    Text('id: $_successId', style: const TextStyle(fontSize: 11, fontFamily: 'DMSans', color: Color(0xFF3B6D11))),
                    const Text('status: pending', style: TextStyle(fontSize: 11, fontFamily: 'DMSans', color: Color(0xFF3B6D11))),
                  ],
                ),
              ),

            // Error state
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFCEBEB),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFF7C1C1)),
                ),
                child: Text(_error!, style: const TextStyle(fontSize: 12, color: Color(0xFF501313), fontFamily: 'DMSans')),
              ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDeco(String? hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(fontSize: 13, color: Color(0xFFB4B2A9)),
    filled: true,
    fillColor: Colors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFE8E5E0))),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFE8E5E0))),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFF888780))),
  );
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override
  Widget build(BuildContext context) => Text(
    text.toUpperCase(),
    style: const TextStyle(
      fontSize: 10, fontFamily: 'DMSans', fontWeight: FontWeight.w500,
      color: Color(0xFF888780), letterSpacing: 0.8,
    ),
  );
}
