import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

import '../models/lifeband_profile.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';

class LifeBandProvider extends ChangeNotifier {
  LifeBandProvider(this._firestore, this._auth) {
    _authSub = _auth.authStateChanges().listen(_handleAuthChange);
    final user = _auth.currentUser;
    if (user != null) {
      unawaited(_loadForUser(user));
    }
  }

  final FirestoreService _firestore;
  final AuthService _auth;
  StreamSubscription<User?>? _authSub;

  List<QrCodeRecord> _qrCodes = const [];
  LifeBandProfile? _profile;
  VisibilitySettings? _visibilitySettings;
  bool _loading = false;
  String? _errorMessage;
  User? _user;

  List<QrCodeRecord> get qrCodes => List.unmodifiable(_qrCodes);
  LifeBandProfile? get profile => _profile;
  VisibilitySettings? get visibilitySettings => _visibilitySettings;
  bool get loading => _loading;
  String? get errorMessage => _errorMessage;
  User? get user => _user;

  Future<void> refresh() async {
    final user = _auth.currentUser;
    if (user == null) {
      _clear();
      return;
    }
    await _loadForUser(user);
  }

  Future<void> _handleAuthChange(User? user) async {
    _user = user;
    if (user == null) {
      _clear();
      return;
    }
    await _loadForUser(user);
  }

  Future<void> _loadForUser(User user) async {
    _loading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final email = user.email ?? '';
      final initialRecords = await _firestore.qrCodesForUser(user.uid, email);
      final claimedRecords = initialRecords.where(
        (qr) =>
            qr.status == 'claimed' &&
            (qr.claimEmail ?? '').toLowerCase() == email.toLowerCase(),
      );
      for (final qr in claimedRecords) {
        await _firestore.attachClaimedQrToUser(qr, user.uid);
      }

      _qrCodes = await _firestore.qrCodesForUser(user.uid, email);
      _profile = await _firestore.profileForUser(user.uid);
      _visibilitySettings = await _firestore.visibilitySettingsForUser(
        user.uid,
      );
    } catch (error) {
      _errorMessage = 'LifeBand verileri alınamadı.';
      debugPrint('LifeBandProvider error: $error');
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  void _clear() {
    _qrCodes = const [];
    _profile = null;
    _visibilitySettings = null;
    _loading = false;
    _errorMessage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _authSub?.cancel();
    super.dispose();
  }
}
