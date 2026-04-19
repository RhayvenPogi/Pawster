"""
apps/surveys/views.py
User endpoints:  GET /api/surveys/user/   POST /api/surveys/response/
Admin endpoints: GET /api/surveys/admin/  GET /api/surveys/admin/pending/
"""
import base64

from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from .models import FollowUpSurvey, SurveyResponse, SurveyPhoto
from .serializers import (
    FollowUpSurveySerializer,
    SurveyResponseSerializer,
    SurveyResponseAdminSerializer,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_surveys(request):
    """
    GET /api/surveys/user/
    Returns pending and completed surveys for the logged-in user.
    Supports optional ?type=7_day|30_day filter.
    """
    surveys   = FollowUpSurvey.objects.filter(user=request.user).select_related("adoption")

    survey_type = request.query_params.get("type")
    if survey_type:
        surveys = surveys.filter(survey_type=survey_type)

    pending   = surveys.filter(status="Pending")
    completed = surveys.filter(status="Completed")

    return Response({
        "success":       True,
        "pending_count": pending.count(),
        "pending":       FollowUpSurveySerializer(pending,   many=True).data,
        "completed":     FollowUpSurveySerializer(completed, many=True).data,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def submit_response(request):
    """
    POST /api/surveys/response/
    Accepts multipart/form-data. Photos come in as repeated "photos" keys.
    Prevents duplicate submissions via OneToOne constraint on survey.
    """
    serializer = SurveyResponseSerializer(
        data=request.data,
        context={"request": request},
    )
    if not serializer.is_valid():
        return Response({"success": False, "errors": serializer.errors}, status=400)

    response = serializer.save()

    # ── Save photos as base64 directly in the database — no files on disk ─────
    for photo_file in request.FILES.getlist("photos")[:5]:
        SurveyPhoto.objects.create(
            response   = response,
            image_data = base64.b64encode(photo_file.read()).decode("utf-8"),
            mime_type  = photo_file.content_type or "image/jpeg",
        )

    return Response(
        {"success": True, "message": "Thank you for your feedback! 🐾"},
        status=201,
    )


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_all_responses(request):
    """
    GET /api/surveys/admin/
    All submitted responses with photos.
    Supports ?survey_type=7_day|30_day and ?health_flag=true filters.
    """
    qs = (
        SurveyResponse.objects
        .all()
        .select_related("survey__adoption", "user")
        .prefetch_related("photos")
    )

    survey_type = request.query_params.get("survey_type")
    if survey_type:
        qs = qs.filter(survey__survey_type=survey_type)

    if request.query_params.get("health_flag") == "true":
        qs = qs.filter(showing_illness=True)

    return Response({
        "success": True,
        "count":   qs.count(),
        "data":    SurveyResponseAdminSerializer(qs, many=True, context={"request": request}).data,
    })


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_pending_surveys(request):
    """
    GET /api/surveys/admin/pending/
    All surveys that have not yet been answered.
    """
    qs = FollowUpSurvey.objects.filter(status="Pending").select_related("adoption", "user")

    survey_type = request.query_params.get("survey_type")
    if survey_type:
        qs = qs.filter(survey_type=survey_type)

    return Response({
        "success": True,
        "count":   qs.count(),
        "data":    FollowUpSurveySerializer(qs, many=True).data,
    })