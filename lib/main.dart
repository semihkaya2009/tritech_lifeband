import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:tritech_lifeband/firebase_options.dart';
import 'package:firebase_auth/firebase_auth.dart';

import 'src/app_theme.dart';
import 'src/providers/device_provider.dart';
import 'src/screens/home_screen.dart';
import 'src/services/firestore_service.dart';
import 'src/services/auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  } catch (e, st) {
    log('Firebase initialization error: $e');
    log('$st');
    rethrow;
  }
  // Ensure anonymous sign-in so we have a uid for authorized device lists
  try {
    await FirebaseAuth.instance.signInAnonymously();
  } catch (_) {}
  runApp(const TriTechApp());
}

class TriTechApp extends StatelessWidget {
  const TriTechApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(create: (_) => FirestoreService()),
        Provider(create: (_) => AuthService()),
        ChangeNotifierProvider(
          create: (ctx) => DeviceProvider(
            ctx.read<FirestoreService>(),
            ctx.read<AuthService>(),
          ),
        ),
      ],
      child: MaterialApp(
        title: 'LifeBand',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const HomeScreen(),
      ),
    );
  }
}
