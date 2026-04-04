"""apps/approvals/serializers.py"""
from rest_framework import serializers
from .models import AdoptionRequest, RehomingRequest

class AdoptionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AdoptionRequest
        fields = "__all__"
        read_only_fields = ["status","reject_note","decided_by","decided_at","adoption_date","created_at","updated_at","user"]

class RehomingRequestSerializer(serializers.ModelSerializer):

    # Nullable booleans — DRF needs these declared explicitly
    is_vaccinated      = serializers.BooleanField(allow_null=True, required=False)
    is_neutered        = serializers.BooleanField(allow_null=True, required=False)
    has_aggression     = serializers.BooleanField(allow_null=True, required=False)
    is_house_trained   = serializers.BooleanField(allow_null=True, required=False)
    is_leash_trained   = serializers.BooleanField(allow_null=True, required=False)
    good_with_children = serializers.BooleanField(allow_null=True, required=False)
    good_with_pets     = serializers.BooleanField(allow_null=True, required=False)

    # Large / optional fields
    photo_base64 = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    vacc_photos  = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True,
        allow_empty=True,
        default=list,
    )
    vaccine_type   = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    last_vacc_date = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    vacc_clinic    = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    vacc_notes     = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model  = RehomingRequest
        fields = "__all__"
        read_only_fields = [
            "status", "reject_note", "decided_by", "decided_at",
            "created_at", "updated_at", "user",
        ]