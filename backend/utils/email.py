import httpx
from core.config import settings
from core.logging import get_logger

logger = get_logger(__name__)

async def send_reset_password_email(to_email: str, reset_token: str) -> bool:
    """
    Sends a password reset email using the Resend API.
    """
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY is not set. Skipping email dispatch.")
        return False

    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json"
    }

    # In development/sandbox mode, Resend only permits sending from onboarding@resend.dev
    sender = "AI Knowledge Base <onboarding@resend.dev>"

    # Create a premium themed HTML body
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                background-color: #0b0f19;
                color: #f3f4f6;
                padding: 40px 20px;
                margin: 0;
            }}
            .container {{
                max-width: 500px;
                margin: 0 auto;
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 32px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }}
            .logo {{
                font-size: 24px;
                font-weight: bold;
                background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 24px;
                display: inline-block;
            }}
            h2 {{
                color: #ffffff;
                margin-bottom: 16px;
                font-size: 20px;
            }}
            p {{
                color: #9ca3af;
                font-size: 15px;
                line-height: 1.5;
                margin-bottom: 24px;
            }}
            .code-box {{
                background: rgba(124, 58, 237, 0.1);
                border: 1px solid rgba(124, 58, 237, 0.3);
                padding: 16px;
                border-radius: 12px;
                font-family: monospace;
                font-size: 14px;
                color: #a78bfa;
                word-break: break-all;
                user-select: all;
                margin-bottom: 24px;
                font-weight: bold;
            }}
            .footer {{
                font-size: 12px;
                color: #6b7280;
                margin-top: 32px;
                border-top: 1px solid rgba(255, 255, 255, 0.05);
                padding-top: 16px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">AI Knowledge Base</div>
            <h2>Password Reset Code</h2>
            <p>You requested to reset your password. Use the following verification code on the password reset page:</p>
            <div class="code-box">{reset_token}</div>
            <p>This code will expire in 15 minutes. If you did not request this, you can safely ignore this email.</p>
            <div class="footer">
                Secured by JWT authentication
            </div>
        </div>
    </body>
    </html>
    """

    payload = {
        "from": sender,
        "to": [to_email],
        "subject": "Reset your AI Knowledge Base Password",
        "html": html_content
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code in [200, 201]:
                logger.info(f"Password reset email sent successfully to {to_email}")
                return True
            else:
                logger.error(f"Failed to send email via Resend: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        logger.error(f"Exception raised while sending password reset email: {e}")
        return False
