from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from apps.approvals import views as approvals_views


urlpatterns = [
    path("admin/",              admin.site.urls),
    path("api/approvals/",      include("apps.approvals.urls")),
    path("api/surveys/",        include("apps.surveys.urls")),
    path("api/notifications/",  include("apps.notifications.urls")),

    # ── User photo (no dedicated users app yet) ────────────────────────────
    path("api/users/<int:pk>/photo/public/", approvals_views.user_photo_public, name="user_photo_public"),

    # OpenAPI schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Swagger UI
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Optional: ReDoc UI
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)