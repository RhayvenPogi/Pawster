import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pawster.settings")

app = Celery("pawster")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

@app.on_after_finalize.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        10.0,
        sender.signature("apps.surveys.tasks.schedule_followup_surveys"),
        name="schedule-followup-surveys-every-10s",
    )