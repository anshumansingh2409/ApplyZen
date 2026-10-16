"""
ApplyZen Real Email Service
Sends real transactional emails (Verification links & OTP codes) using Resend (resend.com)
with optional SMTP fallback.
"""
import smtplib
import asyncio
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.core.config import settings
from app.core.logging import logger
import resend


class EmailService:
    def _create_verification_html(self, name: str, verify_url: str, otp: str) -> str:
        first_name = (name or "there").split()[0]
        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your ApplyZen email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 15px; color: #1e293b;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    
    <!-- Header -->
    <div style="background-color: #05603a; padding: 32px 24px; text-align: center;">
      <div style="display: inline-block; width: 44px; height: 44px; background: rgba(255,255,255,0.15); border-radius: 12px; line-height: 44px; font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 12px;">
        A
      </div>
      <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">ApplyZen</h1>
      <p style="color: #a7f3d0; font-size: 13px; margin: 6px 0 0 0;">Autonomous Career Copilot</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 36px 32px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 14px;">Great, now verify your email</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        Hi <strong>{first_name}</strong>, thanks for creating an ApplyZen account! Enter your 6-digit verification code below or click the button to activate your account.
      </p>

      <!-- 6 Digit OTP Box -->
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="color: #166534; font-size: 13px; margin: 0 0 8px 0; font-weight: 600;">Your Verification Code (OTP):</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #05603a; font-family: monospace;">{otp}</div>
        <p style="color: #15803d; font-size: 11px; margin: 8px 0 0 0;">Valid for 24 hours</p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="{verify_url}" style="background-color: #05603a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 14px; font-weight: 600; display: inline-block; box-shadow: 0 2px 6px rgba(5, 96, 58, 0.25);">
          Verify Email Address Directly
        </a>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 24px;">
        If you didn't create an ApplyZen account, you can safely ignore this email.
      </p>

      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
        <p style="color: #94a3b8; font-size: 11px; word-break: break-all; margin: 0;">
          Direct link: <a href="{verify_url}" style="color: #05603a;">{verify_url}</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        &copy; 2026 ApplyZen AI Inc. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>"""

    def _send_via_resend(self, to_email: str, subject: str, html_content: str) -> bool:
        if not settings.RESEND_API_KEY:
            logger.warning("⚠️ [EmailService] RESEND_API_KEY is not configured in backend/.env. Please add it to send real emails.")
            return False

        try:
            resend.api_key = settings.RESEND_API_KEY
            sender = settings.RESEND_FROM or "ApplyZen <onboarding@resend.dev>"
            params: resend.Emails.SendParams = {
                "from": sender,
                "to": [to_email],
                "subject": subject,
                "html": html_content
            }
            res = resend.Emails.send(params)
            logger.info(f"✅ [EmailService] Real email delivered via Resend to {to_email}. Result: {res}")
            return True
        except Exception as e:
            logger.error(f"❌ [EmailService] Resend delivery failed to {to_email}: {e}")
            return False

    def _send_via_smtp(self, to_email: str, subject: str, html_content: str) -> bool:
        if not settings.SMTP_HOST or not settings.SMTP_USER:
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = settings.SMTP_FROM or settings.SMTP_USER
            msg["To"] = to_email

            part = MIMEText(html_content, "html")
            msg.attach(part)

            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.ehlo()
            if settings.SMTP_PORT in (587, 25):
                server.starttls()
                server.ehlo()
            if settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], [to_email], msg.as_string())
            server.quit()
            logger.info(f"✅ [EmailService] Real email delivered via SMTP to {to_email}")
            return True
        except Exception as e:
            logger.error(f"❌ [EmailService] SMTP delivery failed to {to_email}: {e}")
            return False

    async def send_verification_email(self, to_email: str, name: str, token: str, otp: str) -> bool:
        verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}&email={to_email}"
        subject = "Great, now verify your email - ApplyZen"
        html = self._create_verification_html(name, verify_url, otp)

        loop = asyncio.get_event_loop()

        # 1. Primary: Try Resend API
        if settings.RESEND_API_KEY:
            sent = await loop.run_in_executor(None, self._send_via_resend, to_email, subject, html)
            if sent:
                return True

        # 2. Secondary: Try SMTP
        if settings.SMTP_HOST and settings.SMTP_USER:
            sent = await loop.run_in_executor(None, self._send_via_smtp, to_email, subject, html)
            if sent:
                return True

        # If neither is configured, log explicit guidance for the user
        logger.warning(
            f"⚠️ [EmailService] Could not send email to '{to_email}' because no email provider is configured. "
            f"Please set RESEND_API_KEY in backend/.env to send real emails to inboxes!"
        )
        return False

    def _create_password_reset_html(self, name: str, reset_url: str, otp: str) -> str:
        first_name = (name or "there").split()[0]
        return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset your ApplyZen password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 40px 15px; color: #1e293b;">
  <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <!-- Header -->
    <div style="background-color: #05603a; padding: 32px 24px; text-align: center;">
      <div style="display: inline-block; width: 44px; height: 44px; background: rgba(255,255,255,0.15); border-radius: 12px; line-height: 44px; font-size: 24px; font-weight: 800; color: #ffffff; margin-bottom: 12px;">
        A
      </div>
      <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">ApplyZen</h1>
      <p style="color: #a7f3d0; font-size: 13px; margin: 6px 0 0 0;">Password Reset Request</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 36px 32px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 14px;">Reset your password</h2>
      <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
        Hi <strong>{first_name}</strong>, we received a request to reset your ApplyZen account password. Enter the 6-digit code below to set a new password.
      </p>

      <!-- 6 Digit OTP Box -->
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="color: #166534; font-size: 13px; margin: 0 0 8px 0; font-weight: 600;">Your Password Reset Code (OTP):</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #05603a; font-family: monospace;">{otp}</div>
        <p style="color: #15803d; font-size: 11px; margin: 8px 0 0 0;">Valid for 1 hour</p>
      </div>

      <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 24px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        &copy; 2026 ApplyZen AI Inc. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>"""

    async def send_password_reset_email(self, to_email: str, name: str, token: str, otp: str) -> bool:
        reset_url = f"{settings.FRONTEND_URL}/login?tab=reset&token={token}&email={to_email}"
        subject = "Reset your ApplyZen password"
        html = self._create_password_reset_html(name, reset_url, otp)

        loop = asyncio.get_event_loop()
        if settings.RESEND_API_KEY:
            sent = await loop.run_in_executor(None, self._send_via_resend, to_email, subject, html)
            if sent:
                return True

        if settings.SMTP_HOST and settings.SMTP_USER:
            sent = await loop.run_in_executor(None, self._send_via_smtp, to_email, subject, html)
            if sent:
                return True

        logger.warning(
            f"⚠️ [EmailService] Password reset email not sent to '{to_email}' (no email provider configured). "
            f"Reset OTP is: {otp}"
        )
        return False


email_service = EmailService()
