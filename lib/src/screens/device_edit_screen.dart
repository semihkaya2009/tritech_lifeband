import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/device_provider.dart';
import '../widgets/glass_app_bar.dart';
import '../widgets/animated_background.dart';
import '../widgets/frosted_container.dart';
import '../app_theme.dart';

class DeviceEditScreen extends StatefulWidget {
  final String deviceId;
  const DeviceEditScreen({super.key, required this.deviceId});

  @override
  State<DeviceEditScreen> createState() => _DeviceEditScreenState();
}

class _DeviceEditScreenState extends State<DeviceEditScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _name;
  final List<MapEntry<String, String>> _rows = [];

  @override
  void initState() {
    super.initState();
    final device = context.read<DeviceProvider>().getById(widget.deviceId);
    _name = device?.name ?? '';
    device?.healthData.forEach((k, v) => _rows.add(MapEntry(k, v)));
  }

  void _addRow() {
    setState(() => _rows.add(const MapEntry('', '')));
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();
    final Map<String, String> newData = {};
    for (final e in _rows) {
      if (e.key.trim().isEmpty) continue;
      newData[e.key.trim()] = e.value;
    }
    final prov = context.read<DeviceProvider>();
    final device = prov.getById(widget.deviceId);
    if (device != null) {
      prov.addOrUpdateById(
        device.copyWith(name: _name, healthData: newData, token: device.token),
      );
    }
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: GlassAppBar(
        title: 'Profili Düzenle',
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
            decoration: BoxDecoration(
              gradient: AppTheme.amberGradient,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppTheme.amberPrimary.withValues(alpha: 0.3),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: IconButton(
              onPressed: _save,
              icon: const Icon(Icons.save, color: Colors.white),
            ),
          ),
        ],
      ),
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20.0),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  const SizedBox(height: 20),

                  // Profile name section
                  FrostedContainer(
                    padding: const EdgeInsets.all(24),
                    borderRadius: 20,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppTheme.amberPrimary.withValues(alpha: 0.1),
                        AppTheme.petroGreen.withValues(alpha: 0.05),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                gradient: AppTheme.amberGradient,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.edit,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Profil Bilgileri',
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        TextFormField(
                          initialValue: _name,
                          style: Theme.of(context).textTheme.bodyLarge,
                          decoration: InputDecoration(
                            labelText: 'Profil Adı',
                            prefixIcon: Icon(
                              Icons.devices,
                              color: AppTheme.amberPrimary,
                            ),
                          ),
                          onSaved: (v) => _name = v ?? '',
                          validator: (v) =>
                              (v == null || v.isEmpty) ? 'Ad gerekli' : null,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Health data section
                  FrostedContainer(
                    padding: const EdgeInsets.all(24),
                    borderRadius: 20,
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        AppTheme.petroGreen.withValues(alpha: 0.1),
                        AppTheme.petroMintGreen.withValues(alpha: 0.05),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                gradient: AppTheme.petroGradient,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.health_and_safety,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Sağlık Bilgileri',
                              style: Theme.of(context).textTheme.titleLarge
                                  ?.copyWith(fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Health data rows
                        ..._rows.asMap().entries.map((entry) {
                          final idx = entry.key;
                          final kv = entry.value;
                          return Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  AppTheme.darkCard.withValues(alpha: 0.8),
                                  AppTheme.darkBg.withValues(alpha: 0.6),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: AppTheme.darkBorder.withValues(
                                  alpha: 0.5,
                                ),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    initialValue: kv.key,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.bodyLarge,
                                    decoration: InputDecoration(
                                      hintText: 'Anahtar (ör. Kan Grubu)',
                                      prefixIcon: Icon(
                                        Icons.label,
                                        color: AppTheme.amberPrimary,
                                        size: 18,
                                      ),
                                    ),
                                    onChanged: (v) => _rows[idx] = MapEntry(
                                      v,
                                      _rows[idx].value,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: TextFormField(
                                    initialValue: kv.value,
                                    style: Theme.of(
                                      context,
                                    ).textTheme.bodyLarge,
                                    decoration: InputDecoration(
                                      hintText: 'Değer (ör. A+)',
                                      prefixIcon: Icon(
                                        Icons.info,
                                        color: AppTheme.petroMintGreen,
                                        size: 18,
                                      ),
                                    ),
                                    onChanged: (v) => _rows[idx] = MapEntry(
                                      _rows[idx].key,
                                      v,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Container(
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        Colors.red.withValues(alpha: 0.8),
                                        Colors.red.withValues(alpha: 0.6),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: IconButton(
                                    icon: const Icon(
                                      Icons.delete_outline,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                    onPressed: () =>
                                        setState(() => _rows.removeAt(idx)),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),

                        const SizedBox(height: 16),

                        // Add new row button
                        Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppTheme.petroGreen.withValues(alpha: 0.1),
                                AppTheme.petroMintGreen.withValues(alpha: 0.05),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: AppTheme.petroMintGreen.withValues(
                                alpha: 0.3,
                              ),
                              width: 2,
                            ),
                          ),
                          child: TextButton.icon(
                            onPressed: _addRow,
                            icon: Icon(
                              Icons.add_circle_outline,
                              color: AppTheme.petroMintGreen,
                            ),
                            label: Text(
                              'Yeni bilgi ekle',
                              style: TextStyle(
                                color: AppTheme.petroMintGreen,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            style: TextButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
