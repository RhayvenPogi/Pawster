"""apps/notifications/urls.py"""
from django.urls import path
from . import views

urlpatterns = [
    path("",              views.list_notifications, name="list_notifications"),
    path("unread-count/", views.unread_count,       name="unread_count"),
    path("read-all/",     views.mark_all_read,      name="mark_all_read"),
    path("<int:pk>/read/", views.mark_read,          name="mark_read"),
]