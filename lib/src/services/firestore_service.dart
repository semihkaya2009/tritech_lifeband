import 'package:cloud_firestore/cloud_firestore.dart';

import '../models/lifeband_profile.dart';
import '../utils/visibility_masker.dart';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  // Collection name
  final String devicesCollection = 'devices';

  Stream<List<Map<String, dynamic>>> devicesStream() {
    return _db.collection(devicesCollection).snapshots().map((snap) {
      return snap.docs.map((d) => d.data()..['id'] = d.id).toList();
    });
  }

  Future<void> setDevice(String id, Map<String, dynamic> data) async {
    await _db
        .collection(devicesCollection)
        .doc(id)
        .set(data, SetOptions(merge: true));
  }

  Future<void> addDevice(Map<String, dynamic> data) async {
    await _db.collection(devicesCollection).add(data);
  }

  Future<String?> findDeviceIdByToken(String token) async {
    final q = await _db
        .collection(devicesCollection)
        .where('token', isEqualTo: token)
        .limit(1)
        .get();
    if (q.docs.isEmpty) return null;
    return q.docs.first.id;
  }

  Future<void> deleteDevice(String deviceId) async {
    await _db.collection(devicesCollection).doc(deviceId).delete();
    // Also remove references in users/*/authorizedDevices where present
    final usersWithRef = await _db
        .collectionGroup('authorizedDevices')
        .where(FieldPath.documentId, isEqualTo: deviceId)
        .get();
    for (final doc in usersWithRef.docs) {
      await doc.reference.delete();
    }
  }

  /// Remove a device from a single user's authorizedDevices list
  /// without deleting the device document itself.
  Future<void> unenrollDeviceForUser(String uid, String deviceId) async {
    final ref = _db
        .collection('users')
        .doc(uid)
        .collection('authorizedDevices')
        .doc(deviceId);
    await ref.delete();
  }

  Future<void> deleteHealthEntry(String deviceId, String key) async {
    final ref = _db.collection(devicesCollection).doc(deviceId);
    await ref.update({'healthData.$key': FieldValue.delete()});
  }

  // Enroll a token for a user: if device with token found, add it to users/{uid}/authorizedDevices
  Future<bool> enrollTokenForUser(String uid, String token) async {
    final deviceId = await findDeviceIdByToken(token);
    if (deviceId == null) return false;
    final ref = _db
        .collection('users')
        .doc(uid)
        .collection('authorizedDevices')
        .doc(deviceId);
    await ref.set({'enrolledAt': FieldValue.serverTimestamp(), 'token': token});
    return true;
  }

  Stream<List<String>> authorizedDeviceIdsStream(String uid) {
    return _db
        .collection('users')
        .doc(uid)
        .collection('authorizedDevices')
        .snapshots()
        .map((snap) => snap.docs.map((d) => d.id).toList());
  }

  Future<List<Map<String, dynamic>>> getDevicesByIds(List<String> ids) async {
    if (ids.isEmpty) return [];
    final batches = <List<String>>[];
    for (var i = 0; i < ids.length; i += 10) {
      batches.add(ids.sublist(i, i + 10 > ids.length ? ids.length : i + 10));
    }
    final results = <Map<String, dynamic>>[];
    for (final batch in batches) {
      final q = await _db
          .collection(devicesCollection)
          .where(FieldPath.documentId, whereIn: batch)
          .get();
      for (final d in q.docs) {
        final map = d.data();
        map['id'] = d.id;
        results.add(map);
      }
    }
    return results;
  }

  Future<List<QrCodeRecord>> qrCodesForUser(String uid, String email) async {
    final normalizedEmail = email.trim().toLowerCase();
    final records = <String, QrCodeRecord>{};

    final owned = await _db
        .collection('qrCodes')
        .where('ownerUid', isEqualTo: uid)
        .orderBy('createdAt', descending: true)
        .get();
    for (final doc in owned.docs) {
      records[doc.id] = QrCodeRecord.fromMap({...doc.data(), 'id': doc.id});
    }

    if (normalizedEmail.isNotEmpty) {
      final claimed = await _db
          .collection('qrCodes')
          .where('claimEmail', isEqualTo: normalizedEmail)
          .where('status', isEqualTo: 'claimed')
          .get();
      for (final doc in claimed.docs) {
        records[doc.id] = QrCodeRecord.fromMap({...doc.data(), 'id': doc.id});
      }
    }

    final list = records.values.toList()
      ..sort((a, b) {
        final left = a.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        final right = b.createdAt ?? DateTime.fromMillisecondsSinceEpoch(0);
        return right.compareTo(left);
      });
    return list;
  }

  Future<void> attachClaimedQrToUser(QrCodeRecord qr, String uid) async {
    await _db.collection('qrCodes').doc(qr.qrId).update({
      'status': 'active',
      'ownerUid': uid,
      'activatedAt': FieldValue.serverTimestamp(),
    });
    await _db.collection('publicProfiles').doc(qr.qrId).set({
      'ownerUid': uid,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<LifeBandProfile?> profileForUser(String uid) async {
    final doc = await _db.collection('profiles').doc(uid).get();
    if (!doc.exists || doc.data() == null) return null;
    return LifeBandProfile.fromMap(doc.data()!);
  }

  Future<VisibilitySettings?> visibilitySettingsForUser(String uid) async {
    final doc = await _db.collection('visibilitySettings').doc(uid).get();
    if (!doc.exists || doc.data() == null) return null;
    return VisibilitySettings.fromMap(doc.data()!);
  }

  Future<void> saveProfileAndVisibility({
    required String uid,
    required String qrId,
    required LifeBandProfile profile,
    required VisibilitySettings visibility,
  }) async {
    final qrRef = _db.collection('qrCodes').doc(qrId);
    final qrSnapshot = await qrRef.get();
    final qrStatus = qrSnapshot.data()?['status']?.toString();
    if (qrStatus == 'claimed') {
      await qrRef.update({
        'status': 'active',
        'ownerUid': uid,
        'activatedAt': FieldValue.serverTimestamp(),
      });
    }

    final profileData = profile.toMap()
      ..['uid'] = uid
      ..['updatedAt'] = FieldValue.serverTimestamp();
    final visibilityData = visibility.toMap()
      ..['uid'] = uid
      ..['updatedAt'] = FieldValue.serverTimestamp();

    await Future.wait([
      _db
          .collection('profiles')
          .doc(uid)
          .set(profileData, SetOptions(merge: true)),
      _db
          .collection('visibilitySettings')
          .doc(uid)
          .set(visibilityData, SetOptions(merge: true)),
      _db.collection('publicProfiles').doc(qrId).set({
        'qrId': qrId,
        'ownerUid': uid,
        'displayFields': compilePublicFields(profile, visibility),
        'visibility': visibilityData['fields'],
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true)),
    ]);
  }
}
