"""apps/surveys/serializers.py"""
from rest_framework import serializers
from django.utils import timezone
from .models import FollowUpSurvey, SurveyResponse, SurveyPhoto


class FollowUpSurveySerializer(serializers.ModelSerializer):
    animal_name   = serializers.CharField(source="adoption.animal_name", read_only=True)
    adoption_date = serializers.DateTimeField(source="adoption.adoption_date", read_only=True)
    has_response  = serializers.SerializerMethodField()

    class Meta:
        model  = FollowUpSurvey
        fields = [
            "id", "survey_type", "status", "scheduled_for",
            "submitted_at", "animal_name", "adoption_date", "has_response",
        ]

    def get_has_response(self, obj):
        return hasattr(obj, "response")


class SurveyPhotoSerializer(serializers.ModelSerializer):
    url           = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model  = SurveyPhoto
        fields = ["id", "url", "thumbnail_url", "uploaded_at"]

    def get_url(self, obj):
        return obj.as_data_url()

    def get_thumbnail_url(self, obj):
        return obj.as_data_url()


class SurveyResponseSerializer(serializers.ModelSerializer):
    survey_id = serializers.IntegerField(write_only=True)

    class Meta:
        model   = SurveyResponse
        exclude = ["user", "survey"]

    def validate_survey_id(self, value):
        user = self.context["request"].user
        try:
            survey = FollowUpSurvey.objects.get(pk=value, user=user)
        except FollowUpSurvey.DoesNotExist:
            raise serializers.ValidationError("Survey not found or doesn't belong to you.")
        if survey.status == "Completed":
            raise serializers.ValidationError("This survey has already been submitted.")
        self.context["survey"] = survey
        return value

    def create(self, validated_data):
        validated_data.pop("survey_id")
        survey   = self.context["survey"]
        response = SurveyResponse.objects.create(
            survey=survey,
            user=self.context["request"].user,
            **validated_data,
        )
        survey.status       = "Completed"
        survey.submitted_at = timezone.now()
        survey.save(update_fields=["status", "submitted_at"])
        return response


class SurveyResponseAdminSerializer(serializers.ModelSerializer):
    survey_type   = serializers.CharField(source="survey.survey_type", read_only=True)
    animal_name   = serializers.CharField(source="survey.adoption.animal_name", read_only=True)
    adopter_name  = serializers.SerializerMethodField()
    adopter_email = serializers.EmailField(source="user.email", read_only=True)
    health_flag   = serializers.SerializerMethodField()
    photos        = SurveyPhotoSerializer(many=True, read_only=True)

    class Meta:
        model  = SurveyResponse
        fields = [
            "id", "survey_type", "animal_name", "adopter_name", "adopter_email",
            "adjustment", "behavioral_notes", "showing_illness", "vet_visited",
            "satisfied", "needs_support", "additional_notes", "rating",
            "submitted_at", "health_flag", "photos",
        ]

    def get_adopter_name(self, obj):
        u = obj.user
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def get_health_flag(self, obj):
        return obj.showing_illness