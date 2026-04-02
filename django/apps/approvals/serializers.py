"""apps/approvals/serializers.py"""
from rest_framework import serializers
from .models import AdoptionRequest, RehomingRequest

class AdoptionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AdoptionRequest
        fields = "__all__"
        read_only_fields = ["status","reject_note","decided_by","decided_at","adoption_date","created_at","updated_at","user"]

class RehomingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RehomingRequest
        fields = "__all__"
        read_only_fields = ["status","reject_note","decided_by","decided_at","created_at","updated_at","user"]