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
from django.conf import settings

from utils.email_service import send_email

logger = logging.getLogger(__name__)


def _send_survey_ready_email(user, animal_name, survey_type):
    label = "7-day" if survey_type == "7_day" else "30-day"
    days  = "7 days" if survey_type == "7_day" else "30 days"
    try:
        html = (
            f'<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;'
            f'background:#fffdf5;border:1.5px solid #e8d8a0;border-radius:16px;overflow:hidden;">'
            f'<div style="background:#1c4f09;padding:28px 32px;text-align:center;">'
            f'<h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;">🐾 Pawster</h1>'
            f'<p style="margin:6px 0 0;color:#a8d890;font-size:13px;">Every Pet Deserves Love</p>'
            f'</div><div style="padding:32px;">'
            f'<h2 style="color:#1a4a08;">Time for your {label} check-in! 📋</h2>'
            f'<p style="color:#3a5020;">Hi {user.first_name or user.username},</p>'
            f'<p style="color:#3a5020;">It\'s been {days} since you adopted <strong>{animal_name}</strong>!</p>'
            f'<p style="color:#3a5020;">Please fill in your short follow-up survey:</p>'
            f'<a href="{settings.APP_BASE_URL}/followup-surveys" '
            f'style="display:inline-block;background:#1c4f09;color:#fff;'
            f'padding:13px 36px;border-radius:50px;text-decoration:none;font-weight:900;">Fill Out Survey →</a>'
            f'</div>'
            f'<div style="background:#f5f0e0;padding:16px 32px;text-align:center;">'
            f'<p style="font-size:11px;color:#9a8a60;">— The Pawster Team</p>'
            f'</div></div>'
        )
        send_email(user.email, f"🐾 Your {label} follow-up for {animal_name} is ready", html)
    except Exception as e:
        logger.warning(f"Failed to send survey email to {user.email}: {e}")


@shared_task
def create_followup_surveys_for_adoption(adoption_id: int):
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

    for survey_type, delta in [("7_day", timedelta(seconds=30)), ("30_day", timedelta(seconds=60))]:
        survey, created = FollowUpSurvey.objects.get_or_create(
            adoption=adoption,
            survey_type=survey_type,
            defaults={
                "user": adoption.user,
                "scheduled_for": base + delta,
                "status": "Pending",
            }
        )
        if created:
            logger.info(f"Created {survey_type} survey for Adoption #{adoption_id}.")

    Notification.objects.create(
        user=adoption.user,
        title="Follow-up surveys scheduled 📋",
        body=(
            f"You'll receive two short check-in surveys for {adoption.animal_name} — "
            f"one at 7 days and one at 30 days after adoption."
        ),
        notif_type="survey_scheduled",
    )


@shared_task
def schedule_followup_surveys():
    from apps.surveys.models import FollowUpSurvey
    from apps.approvals.models import AdoptionRequest
    from apps.notifications.models import Notification

    now = timezone.now()
    approved = AdoptionRequest.objects.filter(
        status="Approved",
        adoption_date__isnull=False,
        user__isnull=False,
    ).select_related("user")

    created_count  = 0
    notified_count = 0

    for adoption in approved:
        base = adoption.adoption_date
        for survey_type, delta in [("7_day", timedelta(seconds=30)), ("30_day", timedelta(seconds=60))]:
            due_date = base + delta

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

            if survey.status == "Pending" and now >= due_date and adoption.user.email:
                label = "7-day" if survey_type == "7_day" else "30-day"

                already_notified = Notification.objects.filter(
                    user=adoption.user,
                    notif_type="survey_due",
                    body__icontains=f"{label} check-in survey for {adoption.animal_name}",
                ).exists()

                if not already_notified:
                    _send_survey_ready_email(adoption.user, adoption.animal_name, survey_type)
                    Notification.objects.create(
                        user=adoption.user,
                        title=f"Follow-up survey ready — {adoption.animal_name} 📋",
                        body=f"Your {label} check-in survey for {adoption.animal_name} is now available.",
                        notif_type="survey_due",
                    )
                    notified_count += 1

    logger.info(f"Survey scheduler: created={created_count}, notified={notified_count}.")
    return f"Created {created_count} surveys, notified {notified_count} adopters."