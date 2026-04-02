"""
apps/notifications/views.py
GET  /api/notifications/          — list user's notifications (newest first)
POST /api/notifications/<id>/read/ — mark one as read
POST /api/notifications/read-all/  — mark all as read
GET  /api/notifications/unread-count/ — unread count (polled by NotificationBell every 60s)
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    qs = Notification.objects.filter(user=request.user)
    return Response({
        "success":      True,
        "unread_count": qs.filter(is_read=False).count(),
        "data":         NotificationSerializer(qs[:40], many=True).data,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unread_count(request):
    """Lightweight endpoint polled by NotificationBell every 60 seconds."""
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({"success": True, "unread_count": count})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_read(request, pk):
    updated = Notification.objects.filter(pk=pk, user=request.user).update(is_read=True)
    if not updated:
        return Response({"success": False, "message": "Not found."}, status=404)
    return Response({"success": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    count = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({"success": True, "marked": count})