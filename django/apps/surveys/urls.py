"""apps/surveys/urls.py"""
from django.urls import path
from . import views

urlpatterns = [
    path("user/",           views.user_surveys,          name="user_surveys"),
    path("response/",       views.submit_response,       name="submit_response"),
    path("admin/",          views.admin_all_responses,   name="admin_all_responses"),
    path("admin/pending/",  views.admin_pending_surveys, name="admin_pending_surveys"),
]