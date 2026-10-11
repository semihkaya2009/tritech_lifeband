import 'dart:async';
import 'package:flutter/material.dart';
import '../models/device.dart';
import '../services/firestore_service.dart';
import '../services/auth_service.dart';

class DeviceProvider extends ChangeNotifier {
  final List<Device> _devices = [];
  final Set<String> _localOnlyDeviceIds = {};

  StreamSubscription? authSub;
  StreamSubscription? _authorizedIdsSub;
  final FirestoreService? _firestore;
  final AuthService? _auth;

  DeviceProvider([FirestoreService? firestore, AuthService? auth])
    : _firestore = firestore,
      _auth = auth {
    // If firestore + auth provided, listen to auth state and update devices based on authorized list
    if (_firestore != null && _auth != null) {
      authSub = _auth.authStateChanges().listen((user) {
        _authorizedIdsSub?.cancel();
        _devices.clear();
        if (user == null) {
          notifyListeners();
          return;
        }
        // listen to authorized device ids for this user
        _authorizedIdsSub = _firestore
            .authorizedDeviceIdsStream(user.uid)
            .listen((ids) async {
              if (ids.isEmpty) {
                _devices.clear();
                notifyListeners();
                return;
              }
              final docs = await _firestore.getDevicesByIds(ids);
              _devices.clear();
              for (final map in docs) {
                _devices.add(Device.fromMap(Map<String, dynamic>.from(map)));
              }
              notifyListeners();
            });
      });
      return;
    }

    _devices.addAll([
      Device(
        id: 'dev-001',
        name: 'TriTech Pro Max',
        healthData: {
          'Kan Grubu': 'A+',
          'Alerjiler': 'Penisilin',
          'Kronik Hastalık': 'Yok',
          'Kalp Atış Hızı': '72 bpm',
          'Kan Basıncı': '120/80 mmHg',
        },
      ),
      Device(
        id: 'dev-002',
        name: 'LifeBand Smart',
        healthData: {
          'Kan Basıncı': '115/75 mmHg',
          'Diyabet': 'Hayır',
          'Kolesterol': '190 mg/dL',
          'BMI': '22.5',
        },
      ),
      Device(
        id: 'dev-003',
        name: 'HealthWatch Elite',
        healthData: {
          'Oksijen Satürasyonu': '%98',
          'Vücut Sıcaklığı': '36.5°C',
          'Uyku Kalitesi': 'İyi',
          'Adım Sayısı': '8,250',
        },
      ),
    ]);
  }

  List<Device> get devices => List.unmodifiable(_devices);

  @override
  void dispose() {
    _authorizedIdsSub?.cancel();
    authSub?.cancel();
    super.dispose();
  }

  void addOrUpdateById(Device device) {
    final idx = _devices.indexWhere((d) => d.id == device.id);
    if (idx >= 0) {
      _devices[idx] = device;
    } else {
      _devices.add(device);
    }
    notifyListeners();
    // persist to firestore if available
    if (_firestore != null && !_localOnlyDeviceIds.contains(device.id)) {
      _firestore.setDevice(device.id, device.toMap());
    }
  }

  void addLocalDemoDevice(Device device) {
    _localOnlyDeviceIds.add(device.id);
    final idx = _devices.indexWhere((d) => d.id == device.id);
    if (idx >= 0) {
      _devices[idx] = device;
    } else {
      _devices.add(device);
    }
    notifyListeners();
  }

  Device? getById(String id) {
    try {
      return _devices.firstWhere((d) => d.id == id);
    } catch (_) {
      return null;
    }
  }

  void updateHealthData(String id, Map<String, String> newData) {
    final idx = _devices.indexWhere((d) => d.id == id);
    if (idx < 0) return;
    _devices[idx] = _devices[idx].copyWith(healthData: newData);
    notifyListeners();
    final device = _devices[idx];
    if (_firestore != null && !_localOnlyDeviceIds.contains(device.id)) {
      _firestore.setDevice(device.id, device.toMap());
    }
  }

  void removeById(String id) {
    _devices.removeWhere((d) => d.id == id);
    _localOnlyDeviceIds.remove(id);
    notifyListeners();
  }
}
