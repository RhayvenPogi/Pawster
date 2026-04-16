from rest_framework import serializers
from .models import AdoptionRequest, RehomingRequest


class AdoptionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdoptionRequest
        fields = "__all__"
        read_only_fields = [
            "status",
            "reject_note",
            "decided_by",
            "decided_at",
            "adoption_date",
            "created_at",
            "updated_at",
            "user",
        ]


class RehomingRequestSerializer(serializers.ModelSerializer):

    owner_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    is_vaccinated = serializers.BooleanField(allow_null=True, required=False)
    is_neutered = serializers.BooleanField(allow_null=True, required=False)
    has_aggression = serializers.BooleanField(allow_null=True, required=False)
    is_house_trained = serializers.BooleanField(allow_null=True, required=False)
    is_leash_trained = serializers.BooleanField(allow_null=True, required=False)
    good_with_children = serializers.BooleanField(allow_null=True, required=False)
    good_with_pets = serializers.BooleanField(allow_null=True, required=False)

    photo_base64 = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    vacc_photos = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_null=True,
        default=list,
    )

    # FIXED: match model (DateField) ❗
    last_vacc_date = serializers.DateField(required=False, allow_null=True)

    vaccine_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    vacc_clinic = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    vacc_notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = RehomingRequest
        fields = "__all__"
        read_only_fields = [
            "status",
            "reject_note",
            "decided_by",
            "decided_at",
            "created_at",
            "updated_at",
            "user",
        ]

    def _resolve_owner_name(self, validated_data, instance=None):
        name = validated_data.get("owner_name")

        if name:
            return name.strip() if isinstance(name, str) else name

        if instance and instance.owner_name:
            return instance.owner_name

        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            full = f"{request.user.first_name} {request.user.last_name}".strip()
            return full or request.user.username

        return "Unknown Owner"

    def create(self, validated_data):
        validated_data["owner_name"] = self._resolve_owner_name(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data["owner_name"] = self._resolve_owner_name(validated_data, instance)
        return super().update(instance, validated_data)