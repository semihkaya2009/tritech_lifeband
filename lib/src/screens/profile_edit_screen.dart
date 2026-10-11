import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/lifeband_profile.dart';
import '../providers/lifeband_provider.dart';
import '../widgets/animated_background.dart';
import '../widgets/frosted_container.dart';
import '../widgets/glass_app_bar.dart';
import 'visibility_settings_screen.dart';

class ProfileEditScreen extends StatefulWidget {
  const ProfileEditScreen({super.key, required this.qr});

  final QrCodeRecord qr;

  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _nationalId = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _birthDate = TextEditingController();
  final _bloodType = TextEditingController();
  final _allergies = TextEditingController();
  final _chronicDiseases = TextEditingController();
  final _medications = TextEditingController();
  final _emergencyContact = TextEditingController();
  final _notes = TextEditingController();

  VisibilitySettings? _visibility;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final provider = context.read<LifeBandProvider>();
    final profile = provider.profile;
    final user = provider.user;
    _firstName.text = profile?.firstName ?? '';
    _lastName.text = profile?.lastName ?? '';
    _nationalId.text = profile?.nationalId ?? '';
    _phone.text = profile?.phone ?? widget.qr.claimPhone ?? '';
    _email.text = profile?.email ?? user?.email ?? widget.qr.claimEmail ?? '';
    _birthDate.text = profile?.birthDate ?? '';
    _bloodType.text = profile?.bloodType ?? '';
    _allergies.text = profile?.allergies ?? '';
    _chronicDiseases.text = profile?.chronicDiseases ?? '';
    _medications.text = profile?.medications ?? '';
    _emergencyContact.text = profile?.emergencyContact ?? '';
    _notes.text = profile?.notes ?? '';
    _visibility =
        provider.visibilitySettings ??
        VisibilitySettings.minimal(user?.uid ?? profile?.uid ?? '');
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _nationalId.dispose();
    _phone.dispose();
    _email.dispose();
    _birthDate.dispose();
    _bloodType.dispose();
    _allergies.dispose();
    _chronicDiseases.dispose();
    _medications.dispose();
    _emergencyContact.dispose();
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: const GlassAppBar(title: 'Profil Düzenle'),
      body: AnimatedBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: FrostedContainer(
              padding: const EdgeInsets.all(20),
              borderRadius: 20,
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    _field(_firstName, 'Ad', required: true),
                    _field(_lastName, 'Soyad', required: true),
                    _field(_nationalId, 'T.C. kimlik'),
                    _field(_phone, 'Telefon'),
                    _field(
                      _email,
                      'E-posta',
                      keyboard: TextInputType.emailAddress,
                    ),
                    _field(_birthDate, 'Doğum tarihi'),
                    _field(_bloodType, 'Kan grubu'),
                    _field(_allergies, 'Alerjiler'),
                    _field(_chronicDiseases, 'Kronik hastalıklar'),
                    _field(_medications, 'İlaçlar'),
                    _field(_emergencyContact, 'Acil durum kişisi'),
                    _field(_notes, 'Notlar', maxLines: 3),
                    const SizedBox(height: 12),
                    OutlinedButton.icon(
                      onPressed: _openVisibility,
                      icon: const Icon(Icons.visibility_outlined),
                      label: Text(
                        'Görünürlük: ${_visibility?.template ?? 'custom'}',
                      ),
                    ),
                    const SizedBox(height: 16),
                    FilledButton.icon(
                      onPressed: _saving ? null : _save,
                      icon: const Icon(Icons.save),
                      label: Text(_saving ? 'Kaydediliyor...' : 'Kaydet'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _field(
    TextEditingController controller,
    String label, {
    bool required = false,
    int maxLines = 1,
    TextInputType? keyboard,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboard,
        decoration: InputDecoration(labelText: label),
        validator: required
            ? (value) {
                if ((value ?? '').trim().isEmpty) return '$label gerekli.';
                return null;
              }
            : null,
      ),
    );
  }

  Future<void> _openVisibility() async {
    final user = context.read<LifeBandProvider>().user;
    if (user == null || _visibility == null) return;
    final result = await Navigator.push<VisibilitySettings>(
      context,
      MaterialPageRoute(
        builder: (_) => VisibilitySettingsScreen(
          uid: user.uid,
          initialSettings: _visibility!,
        ),
      ),
    );
    if (result != null) {
      setState(() => _visibility = result);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final provider = context.read<LifeBandProvider>();
    final user = provider.user;
    final visibility = _visibility;
    if (user == null || visibility == null) return;

    setState(() => _saving = true);
    final profile = LifeBandProfile(
      uid: user.uid,
      firstName: _firstName.text.trim(),
      lastName: _lastName.text.trim(),
      nationalId: _nationalId.text.trim(),
      phone: _phone.text.trim(),
      email: _email.text.trim().toLowerCase(),
      birthDate: _birthDate.text.trim(),
      bloodType: _bloodType.text.trim(),
      allergies: _allergies.text.trim(),
      chronicDiseases: _chronicDiseases.text.trim(),
      medications: _medications.text.trim(),
      emergencyContact: _emergencyContact.text.trim(),
      notes: _notes.text.trim(),
    );

    try {
      await provider.saveProfileAndVisibility(
        qrId: widget.qr.qrId,
        profile: profile,
        visibility: visibility,
      );
      if (!mounted) return;
      Navigator.pop(context);
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }
}
