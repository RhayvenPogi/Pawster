"""
apps/surveys/tasks.py
Two Celery tasks:
  1. create_followup_surveys_for_adoption — called immediately when admin approves
  2. schedule_followup_surveys            — safety-net via Celery Beat (runs every 10s)
Both send an email notification to the adopter when a survey becomes available.
"""
import logging
from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings

logger = logging.getLogger(__name__)


def _send_survey_ready_email(user, animal_name, survey_type):
    """Email the adopter telling them a follow-up survey is ready."""
    label = "30-second" if survey_type == "30_sec" else "60-second"  # ← changed
    try:
        send_mail(
            subject=f"🐾 Your {label} follow-up for {animal_name} is ready",
            message=(
                f"Hi {user.first_name or user.username},\n\n"
                f"It's been {'30 seconds' if survey_type == '30_sec' else '60 seconds'} since you adopted {animal_name}!\n\n"  # ← changed
                f"We'd love to hear how things are going. Please fill in your short "
                f"follow-up survey at:\n\n"
                f"{settings.APP_BASE_URL}/followup-surveys\n\n"
                f"It only takes 2 minutes and helps us keep improving our adoption process.\n\n"
                f"— The Pawster Team"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )
    except Exception as e:
        logger.warning(f"Failed to send survey email to {user.email}: {e}")


@shared_task
def create_followup_surveys_for_adoption(adoption_id: int):
    """
    Called immediately when admin approves an adoption (from approvals/views.py).
    Creates FollowUpSurvey records for 30-sec and 60-sec.
    Also fires in-app notifications + emails.
    """
    from apps.surveys.models import FollowUpSurvey
    from apps.approvals.models import AdoptionRequest
    from apps.notifications.models import Notification

    try:
        adoption = AdoptionRequest.objects.get(pk=adoption_id)
    except AdoptionRequest.DoesNotExist:
        logger.error(f"create_followup_surveys: Adoption #{adoption_id} not found.")
        return

    if not adoption.user:
        logger.warning(f"Adoption #{adoption_id} has no linked user — skipping surveys.")
        return

    base = adoption.adoption_date or timezone.now()

    for survey_type, seconds in [("30_sec", 30), ("60_sec", 60)]:  # ← changed
        survey, created = FollowUpSurvey.objects.get_or_create(
            adoption=adoption,
            survey_type=survey_type,
            defaults={
                "user": adoption.user,
                "scheduled_for": base + timedelta(seconds=seconds),  # ← changed
                "status": "Pending",
            }
        )
        if created:
            logger.info(f"Created {survey_type} survey for Adoption #{adoption_id}.")

    # Notify the adopter that surveys are coming
    Notification.objects.create(
        user=adoption.user,
        title="Follow-up surveys scheduled 📋",
        body=(
            f"You'll receive two short check-in surveys for {adoption.animal_name} — "
            f"one at 30 seconds and one at 60 seconds after adoption."  # ← changed
        ),
        notif_type="survey_scheduled",
    )


@shared_task
def schedule_followup_surveys():
    """
    Runs every 10 seconds via Celery Beat.
    Scans all approved adoptions and:
      - Creates any missing FollowUpSurvey records
      - Sends email + in-app notification when a survey first becomes due
    """
    from apps.surveys.models import FollowUpSurvey
    from apps.approvals.models import AdoptionRequest
    from apps.notifications.models import Notification

    now = timezone.now()
    approved = AdoptionRequest.objects.filter(
        status="Approved",
        adoption_date__isnull=False,
        user__isnull=False,
    ).select_related("user")

    created_count = 0
    notified_count = 0

    for adoption in approved:
        base = adoption.adoption_date
        for survey_type, seconds in [("30_sec", 30), ("60_sec", 60)]:  # ← changed
            due_date = base + timedelta(seconds=seconds)  # ← changed

            survey, created = FollowUpSurvey.objects.get_or_create(
                adoption=adoption,
                survey_type=survey_type,
                defaults={
                    "user": adoption.user,
                    "scheduled_for": due_date,
                    "status": "Pending",
                }
            )

            if created:
                created_count += 1

            # Send email + notification once the survey becomes due
            if (
                survey.status == "Pending"
                and now >= due_date  # ← changed: seconds-based, not date comparison
                and adoption.user.email
            ):
                _send_survey_ready_email(adoption.user, adoption.animal_name, survey_type)

                # In-app notification (avoid duplicates)
                already_notified = Notification.objects.filter(
                    user=adoption.user,
                    notif_type="survey_due",
                    body__icontains=adoption.animal_name,
                ).exists()  # ← changed: dropped date filter, seconds are too fast for date bucketing

                if not already_notified:
                    label = "30-second" if survey_type == "30_sec" else "60-second"  # ← changed
                    Notification.objects.create(
                        user=adoption.user,
                        title=f"Follow-up survey ready — {adoption.animal_name} 📋",
                        body=f"Your {label} check-in survey for {adoption.animal_name} is now available. Tap to fill it in.",
                        notif_type="survey_due",
                    )
                    notified_count += 1

    logger.info(
        f"Survey scheduler: created={created_count} surveys, "
        f"notified={notified_count} adopters."
    )
    return f"Created {created_count} surveys, notified {notified_count} adopters."