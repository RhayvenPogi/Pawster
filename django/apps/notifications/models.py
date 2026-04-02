"""apps/notifications/models.py"""
from django.db import models
from django.contrib.auth.models import User


class Notification(models.Model):
    TYPE_CHOICES = [
        ("adoption_approved",  "Adoption Approved"),
        ("adoption_rejected",  "Adoption Rejected"),
        ("rehoming_approved",  "Rehoming Approved"),
        ("rehoming_rejected",  "Rehoming Rejected"),
        ("survey_scheduled",   "Survey Scheduled"),
        ("survey_due",         "Survey Due"),
        ("general",            "General"),
    ]

    user       = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    title      = models.CharField(max_length=200)
    body       = models.TextField()
    notif_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default="general")
    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering   = ["-created_at"]
        db_table   = "django_notifications"

    def __str__(self):
        return f"[{self.notif_type}] {self.user.username} — {self.title}"