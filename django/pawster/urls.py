from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/",              admin.site.urls),
    path("api/approvals/",      include("apps.approvals.urls")),
    path("api/surveys/",        include("apps.surveys.urls")),
    path("api/notifications/",  include("apps.notifications.urls")),
]