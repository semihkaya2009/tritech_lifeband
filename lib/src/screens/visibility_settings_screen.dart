import 'package:flutter/material.dart';

import '../models/lifeband_profile.dart';
import '../widgets/animated_background.dart';
import '../widgets/frosted_container.dart';
import '../widgets/glass_app_bar.dart';

const _fieldLabels = {
  'fullName': 'Ad Soyad',
  'nationalId': 'T.C. kimlik',
  'phone': 'Telefon',
  'email': 'E-posta',
  'birthDate': 'Doğum tarihi',
  'bloodType': 'Kan grubu',
  'allergies': 'Alerjiler',
  'chronicDiseases': 'Kronik hastalıklar',
  'medications': 'İlaçlar',
  'emergencyContact': 'Acil durum kişisi',
  'notes': 'Notlar',
};

class VisibilitySettingsScreen extends StatefulWidget {
  const VisibilitySettingsScreen({
    super.key,
    required this.uid,
    required this.initialSettings,
  });

  final String uid;
  final VisibilitySettings initialSettings;

  @override
  State<VisibilitySettingsScreen> createState() =>
      _VisibilitySettingsScreenState();
}

class _VisibilitySettingsScreenState extends State<VisibilitySettingsScreen> {
  late Map<String, VisibilityLevel> _fields;
  late String _template;

  @override
  void initState() {
    super.initState();
    _fields = Map.of(widget.initialSettings.fields);
    _template = widget.initialSettings.template;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const GlassAppBar(title: 'Görünürlük'),
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                FrostedContainer(
                  padding: const EdgeInsets.all(16),
                  borderRadius: 18,
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _templateButton('minimal', 'Minimal'),
                      _templateButton('emergency', 'Acil'),
                      _templateButton('staffFocused', 'Personel'),
                      _templateButton('custom', 'Özel'),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                ..._fieldLabels.entries.map(
                  (entry) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: FrostedContainer(
                      padding: const EdgeInsets.all(14),
                      borderRadius: 16,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            entry.value,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: VisibilityLevel.values
                                .map(
                                  (level) => ChoiceChip(
                                    label: Text(_labelFor(level)),
                                    selected:
                                        (_fields[entry.key] ??
                                            VisibilityLevel.private) ==
                                        level,
                                    onSelected: (_) {
                                      setState(() {
                                        _fields[entry.key] = level;
                                        _template = 'custom';
                                      });
                                    },
                                  ),
                                )
                                .toList(),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () {
                    Navigator.pop(
                      context,
                      VisibilitySettings(
                        uid: widget.uid,
                        fields: _fields,
                        template: _template,
                      ),
                    );
                  },
                  icon: const Icon(Icons.check),
                  label: const Text('Görünürlüğü uygula'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _templateButton(String key, String label) {
    return ChoiceChip(
      label: Text(label),
      selected: _template == key,
      onSelected: (_) {
        setState(() {
          final settings = switch (key) {
            'minimal' => VisibilitySettings.minimal(widget.uid),
            'emergency' => VisibilitySettings.emergency(widget.uid),
            'staffFocused' => VisibilitySettings.staffFocused(widget.uid),
            _ => VisibilitySettings(uid: widget.uid, fields: _fields),
          };
          _fields = Map.of(settings.fields);
          _template = settings.template;
        });
      },
    );
  }

  String _labelFor(VisibilityLevel level) {
    return switch (level) {
      VisibilityLevel.private => 'Gizli',
      VisibilityLevel.public => 'Açık',
      VisibilityLevel.staff => 'Personel',
      VisibilityLevel.masked => 'Yarı',
    };
  }
}
