"""apps/approvals/urls.py"""
from django.urls import path
from . import views

urlpatterns = [
    # User
    path("adoptions/",                      views.submit_adoption,   name="submit_adoption"),
    path("rehoming/",                       views.submit_rehoming,   name="submit_rehoming"),
    # Admin — list
    path("adoptions/admin/",               views.list_adoptions,    name="list_adoptions"),
    path("rehoming/admin/",                views.list_rehoming,     name="list_rehoming"),
    # Admin — approve / reject
    path("adoptions/<int:pk>/approve/",    views.approve_adoption,  name="approve_adoption"),
    path("adoptions/<int:pk>/reject/",     views.reject_adoption,   name="reject_adoption"),
    path("rehoming/<int:pk>/approve/",     views.approve_rehoming,  name="approve_rehoming"),
    path("rehoming/<int:pk>/reject/",      views.reject_rehoming,   name="reject_rehoming"),
]