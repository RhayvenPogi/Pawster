// lib/services/database_service.dart

import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/vet_clinic.dart';
import '../data/clinic_data.dart';

class DatabaseService {
  static Database? _db;
  static const _dbName = 'pawaywan.db';
  static const _dbVersion = 1;
  static const _table = 'vet_clinics';

  // Singleton
  static Future<Database> get database async {
    _db ??= await _initDb();
    return _db!;
  }

  static Future<Database> _initDb() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, _dbName);

    return await openDatabase(path, version: _dbVersion, onCreate: _onCreate);
  }

  static Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE $_table (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        name           TEXT    NOT NULL,
        latitude       REAL    NOT NULL,
        longitude      REAL    NOT NULL,
        address        TEXT    NOT NULL,
        contact_number TEXT    NOT NULL,
        rating         REAL    NOT NULL,
        image_url      TEXT    NOT NULL,
        local_image    TEXT    NOT NULL DEFAULT ''
      )
    ''');

    // Seed with the default La Union clinics
    final batch = db.batch();
    for (final clinic in laUnionClinics) {
      batch.insert(_table, clinic.toMap());
    }
    await batch.commit(noResult: true);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  /// Fetch all clinics from the database.
  static Future<List<VetClinic>> getAllClinics() async {
    final db = await database;
    final rows = await db.query(_table, orderBy: 'name ASC');
    return rows.map(VetClinic.fromMap).toList();
  }

  /// Insert a new clinic. Returns the new row id.
  static Future<int> insertClinic(VetClinic clinic) async {
    final db = await database;
    return await db.insert(
      _table,
      clinic.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Update an existing clinic (must have a valid id).
  static Future<int> updateClinic(VetClinic clinic) async {
    assert(clinic.id != null, 'Cannot update a clinic without an id');
    final db = await database;
    return await db.update(
      _table,
      clinic.toMap(),
      where: 'id = ?',
      whereArgs: [clinic.id],
    );
  }

  /// Delete a clinic by id.
  static Future<int> deleteClinic(int id) async {
    final db = await database;
    return await db.delete(_table, where: 'id = ?', whereArgs: [id]);
  }

  /// Search clinics by name (case-insensitive).
  static Future<List<VetClinic>> searchClinics(String query) async {
    final db = await database;
    final rows = await db.query(
      _table,
      where: 'name LIKE ?',
      whereArgs: ['%$query%'],
      orderBy: 'name ASC',
    );
    return rows.map(VetClinic.fromMap).toList();
  }

  /// Wipe and re-seed the database (useful for testing / reset).
  static Future<void> resetDatabase() async {
    final db = await database;
    await db.delete(_table);
    final batch = db.batch();
    for (final clinic in laUnionClinics) {
      batch.insert(_table, clinic.toMap());
    }
    await batch.commit(noResult: true);
  }

  static Future<void> closeDatabase() async {
    await _db?.close();
    _db = null;
  }
}
