import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../app_theme.dart';
import '../services/auth_service.dart';
import '../widgets/animated_background.dart';
import '../widgets/frosted_container.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _registerMode = false;
  bool _loading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: FrostedContainer(
                padding: const EdgeInsets.all(24),
                borderRadius: 20,
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          gradient: AppTheme.petroGradient,
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: const Icon(
                          Icons.health_and_safety,
                          color: Colors.white,
                          size: 34,
                        ),
                      ),
                      const SizedBox(height: 20),
                      Text(
                        _registerMode
                            ? 'LifeBand hesabı oluştur'
                            : 'LifeBand hesabına giriş',
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'QR kaydın, aynı e-posta ile giriş yaptığında otomatik olarak hesabına bağlanır.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      if (_errorMessage != null) ...[
                        const SizedBox(height: 16),
                        Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.redAccent),
                        ),
                      ],
                      const SizedBox(height: 20),
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        autofillHints: const [AutofillHints.email],
                        decoration: const InputDecoration(labelText: 'E-posta'),
                        validator: (value) {
                          final text = value?.trim() ?? '';
                          if (!text.contains('@')) {
                            return 'Geçerli e-posta gir.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: true,
                        autofillHints: const [AutofillHints.password],
                        decoration: const InputDecoration(labelText: 'Şifre'),
                        validator: (value) {
                          if ((value ?? '').length < 6) {
                            return 'Şifre en az 6 karakter olmalı.';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 20),
                      FilledButton(
                        onPressed: _loading ? null : _submit,
                        child: _loading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(_registerMode ? 'Kayıt ol' : 'Giriş yap'),
                      ),
                      TextButton(
                        onPressed: _loading
                            ? null
                            : () {
                                setState(() {
                                  _registerMode = !_registerMode;
                                  _errorMessage = null;
                                });
                              },
                        child: Text(
                          _registerMode
                              ? 'Zaten hesabım var'
                              : 'Yeni hesap oluştur',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    final auth = context.read<AuthService>();
    try {
      if (_registerMode) {
        await auth.registerWithEmailPassword(
          _emailController.text,
          _passwordController.text,
        );
      } else {
        await auth.signInWithEmailPassword(
          _emailController.text,
          _passwordController.text,
        );
      }
    } on FirebaseAuthException catch (error) {
      setState(() {
        _errorMessage = _messageFor(error);
      });
    } catch (_) {
      setState(() {
        _errorMessage = 'Giriş yapılamadı. Tekrar dene.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  String _messageFor(FirebaseAuthException error) {
    switch (error.code) {
      case 'email-already-in-use':
        return 'Bu e-posta ile hesap var.';
      case 'invalid-credential':
      case 'wrong-password':
      case 'user-not-found':
        return 'E-posta veya şifre hatalı.';
      default:
        return 'Giriş yapılamadı: ${error.code}';
    }
  }
}
