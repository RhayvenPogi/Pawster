"""
apps/surveys/models.py
FollowUpSurvey  — one record per schedule (30-sec / 60-sec) per adoption
SurveyResponse  — adopter's answers; OneToOne with FollowUpSurvey (duplicate-safe)
"""
from django.db import models
from django.contrib.auth.models import User
from apps.approvals.models import AdoptionRequest


class FollowUpSurvey(models.Model):
    SURVEY_TYPE = [
    ("7_day",  "7-Day Follow-Up"),
    ("30_day", "30-Day Follow-Up"),
]
    STATUS      = [("Pending", "Pending"), ("Completed", "Completed")]

    adoption      = models.ForeignKey(AdoptionRequest, on_delete=models.CASCADE, related_name="followup_surveys")
    user          = models.ForeignKey(User, on_delete=models.CASCADE, related_name="followup_surveys")
    survey_type   = models.CharField(max_length=10, choices=SURVEY_TYPE)
    status        = models.CharField(max_length=15, choices=STATUS, default="Pending")
    scheduled_for = models.DateTimeField()
    submitted_at  = models.DateTimeField(null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-scheduled_for"]
        unique_together = [("adoption", "survey_type")]
        db_table = "django_followup_surveys"

    def __str__(self):
        return f"[{self.survey_type}] Adoption #{self.adoption_id} — {self.status}"


class SurveyResponse(models.Model):
    ADJUSTMENT = [("Very well","Very well"),("Moderate","Moderate"),("Struggling","Struggling")]
    RATING     = [(i, str(i)) for i in range(1, 6)]

    survey = models.OneToOneField(FollowUpSurvey, on_delete=models.CASCADE, related_name="response")
    user   = models.ForeignKey(User, on_delete=models.CASCADE)

    # Pet adjustment
    adjustment       = models.CharField(max_length=20, choices=ADJUSTMENT)
    behavioral_notes = models.TextField(blank=True)

    # Pet health flags
    showing_illness = models.BooleanField(default=False)
    vet_visited     = models.BooleanField(default=False)

    # Adopter satisfaction
    satisfied        = models.BooleanField(default=True)
    needs_support    = models.BooleanField(default=False)
    additional_notes = models.TextField(blank=True)

    # Star rating 1–5
    rating = models.IntegerField(choices=RATING, default=5)

    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "django_survey_responses"

    def __str__(self):
        return f"Response — Survey #{self.survey_id} — ⭐{self.rating}"