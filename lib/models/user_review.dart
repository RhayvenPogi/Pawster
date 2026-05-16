/// Represents a single user-submitted review for a [VetClinic].
class UserReview {
  /// The auto-incremented primary key from the database.
  /// Null when the review has not yet been persisted.
  final int? id;


  /// The [VetClinic.id] this review belongs to.
  final int clinicId;


  /// Display name of the person who submitted the review.
  final String reviewerName;


  /// Star rating given by the reviewer, in the range 1.0–5.0 (inclusive).
  final double starRating;


  /// Free-text feedback left by the reviewer.
  final String comment;


  /// UTC timestamp recording when the review was first created.
  final DateTime createdAt;


  /// Creates a [UserReview].
  ///
  /// [id] may be omitted when constructing an unsaved review; it will be
  /// assigned by the database upon insertion.
  const UserReview({
    this.id,
    required this.clinicId,
    required this.reviewerName,
    required this.starRating,
    required this.comment,
    required this.createdAt,
  });


  /// Serialises this review to a column-name-keyed map suitable for
  /// inserting or updating a row in the local SQLite database.
  ///
  /// [id] is omitted from the map when null so that the database can
  /// auto-generate the primary key on insert.
  Map<String, dynamic> toMap() => {
    if (id != null) 'id': id,
    'clinic_id': clinicId,
    'reviewer_name': reviewerName,
    'star_rating': starRating,
    'comment': comment,
    // Stored as an ISO-8601 string for portability across platforms.
    'created_at': createdAt.toIso8601String(),
  };


  /// Creates a [UserReview] from a column-name-keyed [m]ap, typically a
  /// row returned by the local SQLite database.
  ///
  /// Throws a [TypeError] if any required column is missing or has an
  /// unexpected type.
  factory UserReview.fromMap(Map<String, dynamic> m) => UserReview(
    id: m['id'] as int?,
    clinicId: m['clinic_id'] as int,
    reviewerName: m['reviewer_name'] as String,
    // Cast via [num] first to handle both int and double storage types.
    starRating: (m['star_rating'] as num).toDouble(),
    comment: m['comment'] as String,
    createdAt: DateTime.parse(m['created_at'] as String),
  );
}



