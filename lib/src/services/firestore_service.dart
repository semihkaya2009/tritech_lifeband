import 'package:cloud_firestore/cloud_firestore.dart';

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
}
