import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:tritech_lifeband/firebase_options.dart';

import 'src/app_theme.dart';
import 'src/providers/device_provider.dart';
import 'src/providers/lifeband_provider.dart';
import 'src/screens/auth_screen.dart';
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
        ChangeNotifierProvider(
          create: (ctx) => LifeBandProvider(
            ctx.read<FirestoreService>(),
            ctx.read<AuthService>(),
          ),
        ),
      ],
      child: MaterialApp(
        title: 'LifeBand',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: Consumer<AuthService>(
          builder: (context, auth, _) {
            return StreamBuilder(
              stream: auth.authStateChanges(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Scaffold(
                    body: Center(child: CircularProgressIndicator()),
                  );
                }
                if (snapshot.data == null) {
                  return const AuthScreen();
                }
                return const HomeScreen();
              },
            );
          },
        ),
      ),
    );
  }
}
