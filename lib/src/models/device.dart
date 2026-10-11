import 'package:flutter/foundation.dart';

class Device {
  final String id;
  final String name;
  final Map<String, String> healthData;
  final String? token;

  const Device({
    required this.id,
    required this.name,
    Map<String, String>? healthData,
    this.token,
  }) : healthData = healthData ?? const {};

  Device copyWith({
    String? name,
    Map<String, String>? healthData,
    String? token,
  }) {
    return Device(
      id: id,
      name: name ?? this.name,
      healthData: healthData ?? Map.from(this.healthData),
      token: token ?? this.token,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'healthData': healthData,
      if (token != null) 'token': token,
    };
  }

  static Device fromMap(Map<String, dynamic> map) {
    final health = <String, String>{};
    if (map['healthData'] is Map) {
      (map['healthData'] as Map).forEach((k, v) {
        health[k.toString()] = v.toString();
      });
    }
    return Device(
      id: map['id']?.toString() ?? UniqueKey().toString(),
      name: map['name']?.toString() ?? 'Unnamed Device',
      healthData: health,
      token: map['token']?.toString(),
    );
  }
}
