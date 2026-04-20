# apps/approvals/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ── Adoption endpoints ─────────────────────────────────────────────────
    path("adoptions/",                    views.submit_adoption,   name="submit_adoption"),
    path("adoptions/admin/",              views.list_adoptions,    name="list_adoptions"),
    path("adoptions/user/",               views.user_adoptions,    name="user_adoptions"),   # ← NEW
    path("adoptions/<int:pk>/approve/",   views.approve_adoption,  name="approve_adoption"),
    path("adoptions/<int:pk>/reject/",    views.reject_adoption,   name="reject_adoption"),
    path("adoptions/<int:pk>/update/",    views.update_adoption,   name="update_adoption"),
    path("adoptions/<int:pk>/delete/",    views.delete_adoption,   name="delete_adoption"),

    # ── Rehoming endpoints ─────────────────────────────────────────────────
    path("rehoming/",                     views.submit_rehoming,   name="submit_rehoming"),
    path("rehoming/admin/",               views.list_rehoming,     name="list_rehoming"),
    path("rehoming/user/",                views.user_rehoming,     name="user_rehoming"),    # ← NEW
    path("rehoming/<int:pk>/approve/",    views.approve_rehoming,  name="approve_rehoming"),
    path("rehoming/<int:pk>/reject/",     views.reject_rehoming,   name="reject_rehoming"),
    path("rehoming/<int:pk>/update/",     views.update_rehoming,   name="update_rehoming"),
    path("rehoming/<int:pk>/delete/",     views.delete_rehoming,   name="delete_rehoming"),
]