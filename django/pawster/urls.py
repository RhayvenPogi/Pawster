from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


urlpatterns = [
    path("admin/",              admin.site.urls),
    path("api/approvals/",      include("apps.approvals.urls")),
    path("api/surveys/",        include("apps.surveys.urls")),
    path("api/notifications/",  include("apps.notifications.urls")),
    # OpenAPI schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Swagger UI
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    # Optional: ReDoc UI
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]