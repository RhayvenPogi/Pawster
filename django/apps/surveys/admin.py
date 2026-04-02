from django.contrib import admin
from .models import FollowUpSurvey, SurveyResponse


@admin.register(FollowUpSurvey)
class FollowUpSurveyAdmin(admin.ModelAdmin):
    list_display  = ["id","user","survey_type","status","scheduled_for","submitted_at"]
    list_filter   = ["survey_type","status"]
    search_fields = ["user__username","adoption__animal_name"]
    readonly_fields = ["created_at","submitted_at"]


@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display  = ["id","survey","adjustment","showing_illness","rating","submitted_at"]
    list_filter   = ["adjustment","rating","showing_illness","satisfied"]
    readonly_fields = ["submitted_at"]