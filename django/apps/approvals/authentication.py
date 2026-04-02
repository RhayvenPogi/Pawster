"""
apps/approvals/authentication.py

Validates JWTs issued by Spring Boot so Django doesn't need its own login.
Spring Boot signs tokens with HS256 using a base64-encoded secret.
We decode that same secret and verify the token here.
"""
import jwt
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class SpringBootJWTAuthentication(BaseAuthentication):
    """
    Reads the Bearer token from Authorization header,
    verifies it with the shared Spring Boot secret,
    and returns (user, token) — creating a Django User on first sight
    if one doesn't exist yet (matched by username/email in the JWT payload).
    """

    def authenticate(self, request):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None  # No token — let permission classes handle it

        token = auth_header.split(" ", 1)[1]

        try:
            payload = jwt.decode(
                token,
                settings.SPRING_JWT_SECRET,
                algorithms=["HS256"],
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Token has expired.")
        except jwt.InvalidTokenError as e:
            raise AuthenticationFailed(f"Invalid token: {e}")

        # Spring Boot stores identity as 'sub' (username or email)
        username = payload.get("sub") or payload.get("username") or payload.get("email")
        if not username:
            raise AuthenticationFailed("Token payload missing subject.")

        # Role for admin detection — Spring Boot stores roles as list or string
        roles = payload.get("roles", payload.get("role", []))
        if isinstance(roles, str):
            roles = [roles]
        is_admin = any(r in roles for r in ["ROLE_ADMIN", "ADMIN", "admin"])

        # Get or create the Django user (no password needed — auth is via JWT)
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email":      payload.get("email", username if "@" in username else ""),
                "first_name": payload.get("firstName", payload.get("given_name", "")),
                "last_name":  payload.get("lastName",  payload.get("family_name", "")),
                "is_staff":   is_admin,
                "is_superuser": is_admin,
            }
        )

        # Sync admin status on every request in case role changed
        if not created and user.is_staff != is_admin:
            user.is_staff = is_admin
            user.is_superuser = is_admin
            user.save(update_fields=["is_staff", "is_superuser"])

        return (user, token)

    def authenticate_header(self, request):
        return "Bearer"