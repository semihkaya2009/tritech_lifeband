import 'dart:developer';

import 'package:firebase_auth/firebase_auth.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  User? get currentUser => _auth.currentUser;

  Stream<User?> authStateChanges() => _auth.authStateChanges();

  Future<User?> signInWithEmailPassword(String email, String password) async {
    try {
      final cred = await _auth.signInWithEmailAndPassword(
        email: email.trim().toLowerCase(),
        password: password,
      );
      return cred.user;
    } on FirebaseAuthException catch (e) {
      log(
        'FirebaseAuthException in signInWithEmailPassword: code=${e.code}, message=${e.message}',
      );
      rethrow;
    } catch (e) {
      log('Unexpected error in signInWithEmailPassword: $e');
      rethrow;
    }
  }

  Future<User?> registerWithEmailPassword(String email, String password) async {
    try {
      final cred = await _auth.createUserWithEmailAndPassword(
        email: email.trim().toLowerCase(),
        password: password,
      );
      return cred.user;
    } on FirebaseAuthException catch (e) {
      log(
        'FirebaseAuthException in registerWithEmailPassword: code=${e.code}, message=${e.message}',
      );
      rethrow;
    } catch (e) {
      log('Unexpected error in registerWithEmailPassword: $e');
      rethrow;
    }
  }

  Future<User?> signInAnonymously() async {
    try {
      final cred = await _auth.signInAnonymously();
      return cred.user;
    } on FirebaseAuthException catch (e) {
      log(
        'FirebaseAuthException in signInAnonymously: code=${e.code}, message=${e.message}',
      );
      rethrow;
    } catch (e) {
      log('Unexpected error in signInAnonymously: $e');
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }
}
