"""
apps/approvals/models.py
AdoptionRequest — full 5-step questionnaire
RehomingRequest — full 4-step questionnaire
"""
from django.db import models
from django.contrib.auth.models import User


class AdoptionRequest(models.Model):
    STATUS = [("Pending","Pending"),("Approved","Approved"),("Rejected","Rejected")]

    # ── Relationship ──────────────────────────────────────────────────────
    user        = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="adoption_requests")
    animal_id   = models.IntegerField()
    animal_name = models.CharField(max_length=120, blank=True)

    # ── Step 1: Contact ───────────────────────────────────────────────────
    name    = models.CharField(max_length=200)
    phone   = models.CharField(max_length=30)
    email   = models.EmailField()
    address = models.TextField()

    # ── Step 1b: Personal intent ──────────────────────────────────────────
    reason               = models.TextField()
    previous_pet         = models.BooleanField(null=True, blank=True)
    previous_pet_details = models.TextField(blank=True)
    primary_caregiver    = models.CharField(max_length=50, blank=True)

    # ── Step 2: Home & living situation ───────────────────────────────────
    housing        = models.CharField(max_length=50, blank=True)
    owns_home      = models.BooleanField(null=True, blank=True)
    pet_permission = models.BooleanField(null=True, blank=True)   # renting only
    pet_space      = models.CharField(max_length=60, blank=True)
    household_size = models.CharField(max_length=20, blank=True)
    has_children   = models.BooleanField(null=True, blank=True)
    children_ages  = models.CharField(max_length=50, blank=True)

    # ── Step 3: Current pets ──────────────────────────────────────────────
    has_other_pets       = models.BooleanField(null=True, blank=True)
    other_pets_detail    = models.CharField(max_length=120, blank=True)
    other_pets_vaccinated = models.BooleanField(null=True, blank=True)
    introduction_plan    = models.TextField(blank=True)

    # ── Step 4: Time & money ──────────────────────────────────────────────
    exp         = models.CharField(max_length=50, blank=True)
    alone_hours = models.CharField(max_length=30, blank=True)
    backup_care = models.CharField(max_length=50, blank=True)
    budget      = models.CharField(max_length=20, blank=True)
    vet_plan    = models.TextField(blank=True)

    # ── Step 5: Responsibility & agreements ───────────────────────────────
    behavior_response  = models.CharField(max_length=60, blank=True)
    open_to_guidance   = models.BooleanField(null=True, blank=True)
    agree_proper_care  = models.BooleanField(default=False)
    agree_long_term    = models.BooleanField(default=False)
    agree_no_abandon   = models.BooleanField(default=False)
    agree_followup     = models.BooleanField(default=False)

    # ── Admin decision ────────────────────────────────────────────────────
    status        = models.CharField(max_length=20, choices=STATUS, default="Pending")
    reject_note   = models.TextField(blank=True)
    decided_by    = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="adoption_decisions")
    decided_at    = models.DateTimeField(null=True, blank=True)
    adoption_date = models.DateTimeField(null=True, blank=True)   # set on Approve

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "django_adoption_requests"

    def __str__(self):
        return f"Adoption #{self.id} — {self.name} → {self.animal_name} [{self.status}]"


class RehomingRequest(models.Model):
    STATUS = [("Pending","Pending"),("Approved","Approved"),("Rejected","Rejected")]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="rehoming_requests")

    # ── Step 1: Pet basics ────────────────────────────────────────────────
    pet_name      = models.CharField(max_length=120)
    species       = models.CharField(max_length=50)
    breed         = models.CharField(max_length=100, blank=True)
    age           = models.CharField(max_length=50)
    gender        = models.CharField(max_length=20)
    duration_owned = models.CharField(max_length=30, blank=True)

    # ── Step 2: Health ────────────────────────────────────────────────────
    is_vaccinated  = models.BooleanField(null=True, blank=True)
    is_neutered    = models.BooleanField(null=True, blank=True)
    medical_notes  = models.TextField(blank=True)

    # ── Step 3: Behavior ──────────────────────────────────────────────────
    behavior           = models.CharField(max_length=30, blank=True)
    behavior_other     = models.CharField(max_length=100, blank=True)
    has_aggression     = models.BooleanField(null=True, blank=True)
    is_house_trained   = models.BooleanField(null=True, blank=True)
    is_leash_trained   = models.BooleanField(null=True, blank=True)
    good_with_children = models.BooleanField(null=True, blank=True)
    good_with_pets     = models.BooleanField(null=True, blank=True)
    ideal_home_desc    = models.TextField(blank=True)

    # ── Step 4: Reason & transition ───────────────────────────────────────
    contact               = models.CharField(max_length=50)
    reason                = models.CharField(max_length=80, blank=True)
    details               = models.TextField(blank=True)
    tried_alternatives    = models.TextField(blank=True)
    can_provide_food      = models.BooleanField(default=False)
    can_provide_carrier   = models.BooleanField(default=False)
    can_provide_records   = models.BooleanField(default=False)
    understands_permanent = models.BooleanField(default=False)
    open_to_followup      = models.BooleanField(default=True)

    # ── Admin decision ────────────────────────────────────────────────────
    status      = models.CharField(max_length=20, choices=STATUS, default="Pending")
    reject_note = models.TextField(blank=True)
    decided_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="rehoming_decisions")
    decided_at  = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Photo & vaccination extras ─────────────────────────────────────────────
    photo_base64   = models.TextField(blank=True)
    vaccine_type   = models.CharField(max_length=120, blank=True)
    last_vacc_date = models.CharField(max_length=30, blank=True)
    vacc_clinic    = models.CharField(max_length=120, blank=True)
    vacc_notes     = models.TextField(blank=True)
    vacc_photos    = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ["-created_at"]
        db_table = "django_rehoming_requests"

    def __str__(self):
        return f"Rehome #{self.id} — {self.pet_name} ({self.species}) [{self.status}]"