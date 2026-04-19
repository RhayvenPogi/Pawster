"""
apps/surveys/views.py
User endpoints:  GET /api/surveys/user/   POST /api/surveys/response/
Admin endpoints: GET /api/surveys/admin/  GET /api/surveys/admin/pending/
"""
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
    """
    surveys   = FollowUpSurvey.objects.filter(user=request.user).select_related("adoption")
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
@parser_classes([MultiPartParser, FormParser])   # ← required for file uploads
def submit_response(request):
    """
    POST /api/surveys/response/
    Accepts multipart/form-data.  Photos come in as repeated "photos" keys.
    Prevents duplicate submissions (OneToOne constraint).
    """
    serializer = SurveyResponseSerializer(
        data=request.data,
        context={"request": request},
    )
    if not serializer.is_valid():
        return Response({"success": False, "errors": serializer.errors}, status=400)

    response = serializer.save()

    # ── Save uploaded photos ───────────────────────────────────────────────────
    photos = request.FILES.getlist("photos")   # matches fd.append("photos", ...) in JS
    for photo_file in photos[:5]:              # hard cap at 5
        SurveyPhoto.objects.create(response=response, image=photo_file)

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
        .prefetch_related("photos")   # ← avoids N+1 on photo thumbnails
    )

    survey_type = request.query_params.get("survey_type")
    if survey_type:
        qs = qs.filter(survey__survey_type=survey_type)

    health_flag = request.query_params.get("health_flag")
    if health_flag == "true":
        qs = qs.filter(showing_illness=True)

    serializer = SurveyResponseAdminSerializer(
        qs, many=True, context={"request": request}   # ← request needed for absolute URLs
    )
    return Response({
        "success": True,
        "count":   qs.count(),
        "data":    serializer.data,
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