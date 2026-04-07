"""
apps/approvals/views.py
10 endpoints — submit adoption/rehome, list all, approve, reject,
UPDATE, and DELETE (each action sends email where applicable).
"""
import requests
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status as drf_status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response

from .models import AdoptionRequest, RehomingRequest
from .serializers import AdoptionRequestSerializer, RehomingRequestSerializer




# ── helpers ──────────────────────────────────────────────────────────────────

def _send(subject, body, to):
    """Fire-and-forget email — never crashes the main request."""
    if not to:
        return
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [to], fail_silently=True)
    except Exception:
        pass


def _adoption_approval_email(adoption):
    _send(
        subject=f"🐾 Your adoption of {adoption.animal_name} has been approved!",
        body=(
            f"Hi {adoption.name},\n\n"
            f"Great news! Your adoption request for {adoption.animal_name} has been approved.\n"
            f"Our team will contact you soon to arrange the handover.\n\n"
            f"Remember: you'll receive follow-up check-ins at 7 days and 30 days "
            f"after adoption to make sure everything is going well.\n\n"
            f"Thank you for choosing to adopt! 🐾\n\n"
            f"— The Pawster Team"
        ),
        to=adoption.email,
    )


def _adoption_rejection_email(adoption):
    _send(
        subject=f"Update on your adoption request for {adoption.animal_name}",
        body=(
            f"Hi {adoption.name},\n\n"
            f"Thank you for your interest in adopting {adoption.animal_name}.\n"
            f"Unfortunately, we are unable to approve your request at this time.\n\n"
            f"Reason: {adoption.reject_note}\n\n"
            f"Please don't be discouraged — browse other animals at {settings.APP_BASE_URL}/pets\n\n"
            f"— The Pawster Team"
        ),
        to=adoption.email,
    )


def _rehome_approval_email(rehome):
    _send(
        subject=f"🏡 Your rehoming request for {rehome.pet_name} has been accepted",
        body=(
            f"Hello,\n\n"
            f"We've reviewed your rehoming request for {rehome.pet_name} ({rehome.species}) "
            f"and we're ready to help.\n\n"
            f"Our team will contact you at {rehome.contact} to coordinate next steps.\n\n"
            f"Thank you for entrusting {rehome.pet_name}'s future to us.\n\n"
            f"— The Pawster Team"
        ),
        to=rehome.user.email if rehome.user else None,
    )


def _rehome_rejection_email(rehome):
    _send(
        subject=f"Update on your rehoming request for {rehome.pet_name}",
        body=(
            f"Hello,\n\n"
            f"We've reviewed your rehoming request for {rehome.pet_name}.\n"
            f"Unfortunately we cannot process it at this time.\n\n"
            f"Reason: {rehome.reject_note}\n\n"
            f"Please reach out if you need further assistance.\n\n"
            f"— The Pawster Team"
        ),
        to=rehome.user.email if rehome.user else None,
    )


def _adoption_update_email(adoption):
    _send(
        subject=f"Your adoption request for {adoption.animal_name} has been updated",
        body=(
            f"Hi {adoption.name},\n\n"
            f"An admin has updated your adoption request for {adoption.animal_name}.\n"
            f"If you have any questions, please contact us.\n\n"
            f"— The Pawster Team"
        ),
        to=adoption.email,
    )


def _rehome_update_email(rehome):
    _send(
        subject=f"Your rehoming request for {rehome.pet_name} has been updated",
        body=(
            f"Hello,\n\n"
            f"An admin has updated your rehoming request for {rehome.pet_name}.\n"
            f"If you have any questions, please reach out to us.\n\n"
            f"— The Pawster Team"
        ),
        to=rehome.user.email if rehome.user else None,
    )


# ── Adoption endpoints ────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_adoption(request):
    """POST /api/approvals/adoptions/  — user submits adoption request"""
    serializer = AdoptionRequestSerializer(data=request.data)
    if serializer.is_valid():
        obj = serializer.save(user=request.user)

        # ✅ Tell Spring Boot to mark the animal as Pending
        try:
            requests.post(
                f"{settings.SPRING_BOOT_API}/api/animals/mark-pending",
                json={"animalName": obj.animal_name},
                timeout=5
            )
        except Exception:
            pass  # Don't fail the submission if Spring Boot is down

        return Response({"success": True, "id": obj.id, "message": "Adoption request submitted."}, status=201)
    return Response({"success": False, "errors": serializer.errors}, status=400)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def list_adoptions(request):
    """GET /api/approvals/adoptions/admin/  — admin lists all adoption requests"""
    qs = AdoptionRequest.objects.all()
    req_status = request.query_params.get("status")
    if req_status:
        qs = qs.filter(status=req_status)
    return Response({"success": True, "data": AdoptionRequestSerializer(qs, many=True).data})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def approve_adoption(request, pk):
    """POST /api/approvals/adoptions/<pk>/approve/  — admin approves"""
    try:
        obj = AdoptionRequest.objects.get(pk=pk)
    except AdoptionRequest.DoesNotExist:
        return Response({"success": False, "message": "Not found."}, status=404)

    obj.status        = "Approved"
    obj.decided_by    = request.user
    obj.decided_at    = timezone.now()
    obj.adoption_date = timezone.now()
    obj.save()

    # ✅ Tell Spring Boot to mark the animal as Adopted
    try:
        spring_url = f"{settings.SPRING_BOOT_API}/api/animals/mark-adopted"
        requests.post(
            spring_url,
            json={"animalName": obj.animal_name},
            timeout=5
        )
    except Exception:
        pass  # Do not break approval if Spring Boot is down

    # Create follow-up surveys via Celery
    from apps.surveys.tasks import create_followup_surveys_for_adoption
    create_followup_surveys_for_adoption.delay(obj.id)

    # Create in-app notification for the adopter
    if obj.user:
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=obj.user,
            title="Adoption Approved! 🎉",
            body=f"Your adoption request for {obj.animal_name} has been approved. We'll contact you soon.",
            notif_type="adoption_approved",
        )

    _adoption_approval_email(obj)
    return Response({"success": True, "message": f"Adoption #{pk} approved."})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def reject_adoption(request, pk):
    """POST /api/approvals/adoptions/<pk>/reject/  — admin rejects"""
    try:
        obj = AdoptionRequest.objects.get(pk=pk)
    except AdoptionRequest.DoesNotExist:
        return Response({"success": False, "message": "Not found."}, status=404)

    reason = request.data.get("reason", "").strip()
    if not reason:
        return Response({"success": False, "message": "Rejection reason is required."}, status=400)

    obj.status      = "Rejected"
    obj.reject_note = reason
    obj.decided_by  = request.user
    obj.decided_at  = timezone.now()
    obj.save()

    if obj.user:
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=obj.user,
            title="Adoption Request Update",
            body=f"Your adoption request for {obj.animal_name} was not approved. Reason: {reason}",
            notif_type="adoption_rejected",
        )

    _adoption_rejection_email(obj)
    return Response({"success": True, "message": f"Adoption #{pk} rejected."})


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def update_adoption(request, pk):
    """PATCH /api/approvals/adoptions/<pk>/update/  — admin edits adoption request fields"""
    try:
        obj = AdoptionRequest.objects.get(pk=pk)
    except AdoptionRequest.DoesNotExist:
        return Response({"success": False, "message": "Not found."}, status=404)

    # Disallow changing status via this endpoint — use approve/reject for that
    data = request.data.copy()
    data.pop("status", None)
    data.pop("decided_by", None)
    data.pop("decided_at", None)

    serializer = AdoptionRequestSerializer(obj, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        _adoption_update_email(obj)
        return Response({"success": True, "message": f"Adoption #{pk} updated.", "data": serializer.data})
    return Response({"success": False, "errors": serializer.errors}, status=400)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_adoption(request, pk):
    """DELETE /api/approvals/adoptions/<pk>/delete/  — admin deletes adoption request"""
    try:
        obj = AdoptionRequest.objects.get(pk=pk)
    except AdoptionRequest.DoesNotExist:
        return Response({"success": False, "message": "Not found."}, status=404)

    animal_name = obj.animal_name
    obj.delete()
    return Response({"success": True, "message": f"Adoption request for '{animal_name}' deleted."})


# ── Rehoming endpoints ────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_rehoming(request):
    """POST /api/approvals/rehoming/  — user submits rehoming request"""
    serializer = RehomingRequestSerializer(data=request.data)
    if serializer.is_valid():
        obj = serializer.save(user=request.user)
        return Response({"success": True, "id": obj.id, "message": "Rehoming request submitted."}, status=201)
    return Response({"success": False, "errors": serializer.errors}, status=400)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def list_rehoming(request):
    """GET /api/approvals/rehoming/admin/  — admin lists all rehoming requests"""
    qs = RehomingRequest.objects.all()
    req_status = request.query_params.get("status")
    if req_status:
        qs = qs.filter(status=req_status)
    return Response({"success": True, "data": RehomingRequestSerializer(qs, many=True).data})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def approve_rehoming(request, pk):
    try:
        obj = RehomingRequest.objects.get(pk=pk)
    except RehomingRequest.DoesNotExist:
        return Response({"success": False, "message": "Not found."}, status=404)

    obj.status     = "Approved"
    obj.decided_by = request.user
    obj.decided_at = timezone.now()
    obj.save()

    # ── Build notes from behavioral flags ─────────────────────────────────
    desc_parts = [
        obj.ideal_home_desc or "",
        (f"Behavior: {obj.behavior}" + (f" ({obj.behavior_other})" if obj.behavior_other else "")) if obj.behavior else "",
        f"Medical notes: {obj.medical_notes}" if obj.medical_notes else "",
        "Good with children." if obj.good_with_children else "",
        "Good with other pets." if obj.good_with_pets else "",
        "House-trained." if obj.is_house_trained else "",
        "Leash-trained." if obj.is_leash_trained else "",
        f"Vaccinated ({obj.vaccine_type})." if obj.is_vaccinated and obj.vaccine_type else "",
    ]
    notes = " ".join(p for p in desc_parts if p).strip() or "Available for adoption."

    # ── Post to Spring Boot ────────────────────────────────────────────────
    try:
        spring_payload = {
            "name":   obj.pet_name or "Unknown",
            "type":   obj.species  or "Other",
            "breed":  obj.breed    or "",
            "age":    obj.age      or "",
            "health": "Healthy",
            "status": "Available",
            "notes":  notes,
            "photo":  obj.photo_base64 or None,
        }
        resp = requests.post(
            f"{settings.SPRING_BOOT_API}/api/animals",
            json=spring_payload,
            timeout=10,
        )
        if not resp.ok:
            print(f"[approve_rehoming] Spring Boot {resp.status_code}: {resp.text[:200]}")
    except Exception as e:
        print(f"[approve_rehoming] Spring Boot unreachable: {e}")

    # ── Notification ──────────────────────────────────────────────────────
    if obj.user:
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=obj.user,
            title="Rehoming Request Accepted 🏡",
            body=f"Your rehoming request for {obj.pet_name} has been accepted. We'll contact you shortly.",
            notif_type="rehoming_approved",
        )

    _rehome_approval_email(obj)
    return Response({"success": True, "message": f"Rehoming #{pk} approved."})


@api_view(["POST"])
@permission_classes([IsAdminUser])
def reject_rehoming(request, pk):
    """POST /api/approvals/rehoming/<pk>/reject/  — admin rejects"""
    try:
        obj = RehomingRequest.objects.get(pk=pk)
    except RehomingRequest.DoesNotExist:
        return Response({"success": False, "message": "Not found."}, status=404)

    reason = request.data.get("reason", "").strip()
    if not reason:
        return Response({"success": False, "message": "Rejection reason is required."}, status=400)

    obj.status      = "Rejected"
    obj.reject_note = reason
    obj.decided_by  = request.user
    obj.decided_at  = timezone.now()
    obj.save()

    if obj.user:
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=obj.user,
            title="Rehoming Request Update",
            body=f"Your rehoming request for {obj.pet_name} was not approved. Reason: {reason}",
            notif_type="rehoming_rejected",
        )

    _rehome_rejection_email(obj)
    return Response({"success": True, "message": f"Rehoming #{pk} rejected."})


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def update_rehoming(request, pk):
    """PATCH /api/approvals/rehoming/<pk>/update/  — admin edits rehoming request fields"""
    try:
        obj = RehomingRequest.objects.get(pk=pk)
    except RehomingRequest.DoesNotExist:
        return Response({"success": False, "message": "Not found."}, status=404)

    # Disallow changing status via this endpoint — use approve/reject for that
    data = request.data.copy()
    data.pop("status", None)
    data.pop("decided_by", None)
    data.pop("decided_at", None)

    serializer = RehomingRequestSerializer(obj, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        _rehome_update_email(obj)
        return Response({"success": True, "message": f"Rehoming #{pk} updated.", "data": serializer.data})
    return Response({"success": False, "errors": serializer.errors}, status=400)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def delete_rehoming(request, pk):
    """DELETE /api/approvals/rehoming/<pk>/delete/  — admin deletes rehoming request"""
    try:
        obj = RehomingRequest.objects.get(pk=pk)
    except RehomingRequest.DoesNotExist:
        return Response({"success": False, "message": "Not found."}, status=404)

    pet_name = obj.pet_name
    obj.delete()
    return Response({"success": True, "message": f"Rehoming request for '{pet_name}' deleted."})