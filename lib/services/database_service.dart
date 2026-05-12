import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/vet_clinic.dart';
import '../data/clinic_data.dart';

/// SQLite data layer for [VetClinic] records.
/// Uses a lazy singleton [_db] so the database is opened only once.
class DatabaseService {
  static Database? _db;

  static const _dbName    = 'pawaywan.db';
  static const _dbVersion = 1;
  static const _table     = 'vet_clinics';

  // ---------------------------------------------------------------------------
  // Singleton database accessor
  // ---------------------------------------------------------------------------

  /// Returns the open [Database], initialising it on first access.
  static Future<Database> get database async {
    _db ??= await _initDb();
    return _db!;
  }

  static Future<Database> _initDb() async {
    final path = join(await getDatabasesPath(), _dbName);
    return openDatabase(path, version: _dbVersion, onCreate: _onCreate);
  }

  /// Creates the [_table] schema and seeds it with the default clinic data.
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

    // Batch-insert the bundled La Union clinic seed data
    final batch = db.batch();
    for (final clinic in laUnionClinics) {
      batch.insert(_table, clinic.toMap());
    }
    await batch.commit(noResult: true);
  }

  // ---------------------------------------------------------------------------
  // CRUD
  // ---------------------------------------------------------------------------

  /// Returns all clinics ordered alphabetically by name.
  static Future<List<VetClinic>> getAllClinics() async {
    final db   = await database;
    final rows = await db.query(_table, orderBy: 'name ASC');
    return rows.map(VetClinic.fromMap).toList();
  }

  /// Inserts [clinic] and returns the auto-generated row id.
  static Future<int> insertClinic(VetClinic clinic) async {
    final db = await database;
    return db.insert(
      _table,
      clinic.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  /// Updates an existing clinic row matched by [clinic.id].
  /// Returns the number of rows affected.
  static Future<int> updateClinic(VetClinic clinic) async {
    assert(clinic.id != null, 'Cannot update a clinic without an id');
    final db = await database;
    return db.update(
      _table,
      clinic.toMap(),
      where: 'id = ?',
      whereArgs: [clinic.id],
    );
  }

  /// Deletes the clinic with the given [id].
  /// Returns the number of rows affected.
  static Future<int> deleteClinic(int id) async {
    final db = await database;
    return db.delete(_table, where: 'id = ?', whereArgs: [id]);
  }

  /// Returns clinics whose name contains [query] (case-insensitive SQL LIKE).
  static Future<List<VetClinic>> searchClinics(String query) async {
    final db   = await database;
    final rows = await db.query(
      _table,
      where: 'name LIKE ?',
      whereArgs: ['%$query%'],
      orderBy: 'name ASC',
    );
    return rows.map(VetClinic.fromMap).toList();
  }

  /// Deletes all rows and reseeds the table with the default clinic data.
  static Future<void> resetDatabase() async {
    final db    = await database;
    await db.delete(_table);
    final batch = db.batch();
    for (final clinic in laUnionClinics) {
      batch.insert(_table, clinic.toMap());
    }
    await batch.commit(noResult: true);
  }

  /// Closes the database connection and clears the singleton.
  /// Call this when the app is shutting down.
  static Future<void> closeDatabase() async {
    await _db?.close();
    _db = null;
  }
}