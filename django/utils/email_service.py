# utils/email_service.py
import sib_api_v3_sdk
from django.conf import settings

def send_email(to, subject, html):
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = settings.BREVO_API_KEY

    api = sib_api_v3_sdk.TransactionalEmailsApi(
        sib_api_v3_sdk.ApiClient(configuration)
    )

    mail = sib_api_v3_sdk.SendSmtpEmail(
        to=[{"email": to}],
        subject=subject,
        html_content=html,
        sender={"name": "Pawster", "email": settings.DEFAULT_FROM_EMAIL}
    )

    api.send_transac_email(mail)