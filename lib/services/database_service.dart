import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/vet_clinic.dart';
import '../models/user_review.dart';
import '../data/clinic_data.dart';


/// SQLite data layer for [VetClinic] and [UserReview] records.
///
/// Uses a singleton [Database] instance so the connection is opened once
/// and reused across the app's lifetime. All methods are static, so no
/// instantiation is needed — just call `DatabaseService.someMethod()`.
class DatabaseService {
  static Database? _db;


  // Database file name stored on the device's local filesystem.
  static const _dbName = 'pawaywan.db';


  // Increment this whenever the schema changes; triggers [_onUpgrade].
  static const _dbVersion = 2; // bumped from 1 → 2 to add user_reviews table


  // Table name constants — centralised here to avoid typo-prone string literals.
  static const _table       = 'vet_clinics';
  static const _reviewTable = 'user_reviews';


  // ---------------------------------------------------------------------------
  // Singleton database accessor
  // ---------------------------------------------------------------------------


  /// Returns the open [Database], initialising it on the first call.
  ///
  /// The `??=` operator ensures [_initDb] is only called once; subsequent
  /// calls return the cached instance immediately.
  static Future<Database> get database async {
    _db ??= await _initDb();
    return _db!;
  }


  /// Resolves the platform-specific databases directory, then opens (or
  /// creates) the SQLite file at that path.
  static Future<Database> _initDb() async {
    final path = join(await getDatabasesPath(), _dbName);
    return openDatabase(
      path,
      version: _dbVersion,
      onCreate:  _onCreate,
      onUpgrade: _onUpgrade,
    );
  }


  /// Called by sqflite the very first time the app runs (no existing DB file).
  ///
  /// Creates the [_table] and [_reviewTable] tables, then bulk-inserts the
  /// bundled [laUnionClinics] seed data using a [Batch] for efficiency.
  static Future<void> _onCreate(Database db, int version) async {
    // --- vet_clinics table ---------------------------------------------------
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
        local_image    TEXT    NOT NULL DEFAULT ''  -- path to a cached local asset, empty if none
      )
    ''');


    // --- user_reviews table --------------------------------------------------
    // ON DELETE CASCADE ensures reviews are removed when their clinic is deleted.
    await db.execute('''
      CREATE TABLE $_reviewTable (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        clinic_id      INTEGER NOT NULL REFERENCES $_table(id) ON DELETE CASCADE,
        reviewer_name  TEXT    NOT NULL,
        star_rating    REAL    NOT NULL,
        comment        TEXT    NOT NULL,
        created_at     TEXT    NOT NULL  -- stored as ISO-8601 string
      )
    ''');


    // Seed initial clinic records in a single batch transaction.
    final batch = db.batch();
    for (final clinic in laUnionClinics) {
      batch.insert(_table, clinic.toMap());
    }
    await batch.commit(noResult: true); // noResult skips returning row IDs, saving memory
  }


  /// Called when the on-device DB version is older than [_dbVersion].
  ///
  /// Each `if (oldVersion < N)` block is additive, so a user jumping from
  /// version 1 straight to 3 will still apply all intermediate migrations.
  static Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      // Migration v1 → v2: introduce the user_reviews table.
      // IF NOT EXISTS guards against the rare case where the table already
      // exists (e.g. a partial upgrade that crashed mid-way).
      await db.execute('''
        CREATE TABLE IF NOT EXISTS $_reviewTable (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          clinic_id      INTEGER NOT NULL REFERENCES $_table(id) ON DELETE CASCADE,
          reviewer_name  TEXT    NOT NULL,
          star_rating    REAL    NOT NULL,
          comment        TEXT    NOT NULL,
          created_at     TEXT    NOT NULL
        )
      ''');
    }
    // Add future migration blocks here:
    // if (oldVersion < 3) { ... }
  }


  // ---------------------------------------------------------------------------
  // VetClinic CRUD
  // ---------------------------------------------------------------------------


  /// Fetches every clinic row, sorted alphabetically by name.
  static Future<List<VetClinic>> getAllClinics() async {
    final db   = await database;
    final rows = await db.query(_table, orderBy: 'name ASC');
    return rows.map(VetClinic.fromMap).toList();
  }


  /// Inserts [clinic] and returns the new row's id.
  ///
  /// [ConflictAlgorithm.replace] means a duplicate primary key silently
  /// overwrites the existing row instead of throwing an error.
  static Future<int> insertClinic(VetClinic clinic) async {
    final db = await database;
    return db.insert(_table, clinic.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace);
  }


  /// Overwrites the persisted fields of [clinic] identified by its [id].
  ///
  /// Asserts that [clinic.id] is non-null at debug time to catch programming
  /// errors early; in release mode the WHERE clause would simply match zero rows.
  static Future<int> updateClinic(VetClinic clinic) async {
    assert(clinic.id != null, 'Cannot update a clinic without an id');
    final db = await database;
    return db.update(_table, clinic.toMap(),
        where: 'id = ?', whereArgs: [clinic.id]);
  }


  /// Permanently deletes the clinic row with the given [id].
  ///
  /// Due to ON DELETE CASCADE on [_reviewTable], all associated reviews are
  /// also removed automatically by SQLite.
  static Future<int> deleteClinic(int id) async {
    final db = await database;
    return db.delete(_table, where: 'id = ?', whereArgs: [id]);
  }


  /// Returns clinics whose [name] contains [query] (case-insensitive via LIKE).
  static Future<List<VetClinic>> searchClinics(String query) async {
    final db   = await database;
    final rows = await db.query(_table,
        where:     'name LIKE ?',
        whereArgs: ['%$query%'], // % wildcards match any leading/trailing characters
        orderBy:   'name ASC');
    return rows.map(VetClinic.fromMap).toList();
  }


  /// Wipes all clinic rows and re-seeds from [laUnionClinics].
  ///
  /// Useful during development or when the user triggers a "restore defaults"
  /// action. Note: this also cascades-deletes all user reviews.
  static Future<void> resetDatabase() async {
    final db = await database;
    await db.delete(_table); // cascade removes reviews too
    final batch = db.batch();
    for (final clinic in laUnionClinics) {
      batch.insert(_table, clinic.toMap());
    }
    await batch.commit(noResult: true);
  }


  /// Closes the underlying SQLite connection and clears the cached instance.
  ///
  /// Call this in [dispose] or when the app is about to terminate to flush
  /// any pending writes and release the file lock.
  static Future<void> closeDatabase() async {
    await _db?.close();
    _db = null; // allow re-initialisation if the app reopens the DB later
  }


  // ---------------------------------------------------------------------------
  // UserReview CRUD
  // ---------------------------------------------------------------------------


  /// Returns all reviews for [clinicId], newest first.
  static Future<List<UserReview>> getReviewsForClinic(int clinicId) async {
    final db   = await database;
    final rows = await db.query(
      _reviewTable,
      where:     'clinic_id = ?',
      whereArgs: [clinicId],
      orderBy:   'created_at DESC', // ISO-8601 strings sort correctly lexicographically
    );
    return rows.map(UserReview.fromMap).toList();
  }


  /// Inserts [review] and returns the new row's id.
  static Future<int> insertReview(UserReview review) async {
    final db = await database;
    return db.insert(_reviewTable, review.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace);
  }


  /// Permanently deletes the review row with the given [id].
  static Future<int> deleteReview(int id) async {
    final db = await database;
    return db.delete(_reviewTable, where: 'id = ?', whereArgs: [id]);
  }
}
