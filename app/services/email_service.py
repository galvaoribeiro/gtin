"""
Serviço de envio de e-mail via SMTP.
=====================================
Usado para recuperação de senha e notificações transacionais.
"""

import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def _build_reset_email(to_email: str, reset_link: str) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = "Redefinir sua senha — Pesquisa GTIN"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    plain = (
        f"Olá,\n\n"
        f"Recebemos uma solicitação para redefinir a senha da sua conta no Pesquisa GTIN.\n\n"
        f"Clique no link abaixo para criar uma nova senha:\n"
        f"{reset_link}\n\n"
        f"Este link expira em {settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutos.\n"
        f"Se você não solicitou a redefinição, ignore este e-mail.\n\n"
        f"— Equipe Pesquisa GTIN"
    )
    msg.set_content(plain)

    html = f"""\
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f4f4f5; padding:40px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#10b981,#06b6d4); padding:32px 32px 24px; text-align:center;">
        <h1 style="margin:0; color:#fff; font-size:22px;">Pesquisa GTIN</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 16px; color:#27272a; font-size:15px; line-height:1.6;">
          Olá,
        </p>
        <p style="margin:0 0 24px; color:#27272a; font-size:15px; line-height:1.6;">
          Recebemos uma solicitação para redefinir a senha da sua conta.
          Clique no botão abaixo para criar uma nova senha:
        </p>
        <p style="text-align:center; margin:0 0 24px;">
          <a href="{reset_link}"
             style="display:inline-block; padding:12px 32px; background:linear-gradient(135deg,#10b981,#06b6d4); color:#fff; text-decoration:none; border-radius:8px; font-weight:600; font-size:15px;">
            Redefinir senha
          </a>
        </p>
        <p style="margin:0 0 8px; color:#71717a; font-size:13px; line-height:1.5;">
          Este link expira em <strong>{settings.PASSWORD_RESET_TOKEN_EXPIRE_MINUTES} minutos</strong>.
        </p>
        <p style="margin:0 0 8px; color:#71717a; font-size:13px; line-height:1.5;">
          Se você não solicitou a redefinição, ignore este e-mail.
        </p>
        <hr style="border:none; border-top:1px solid #e4e4e7; margin:24px 0;" />
        <p style="margin:0; color:#a1a1aa; font-size:12px; line-height:1.5;">
          Caso o botão não funcione, copie e cole o link abaixo no navegador:<br/>
          <a href="{reset_link}" style="color:#10b981; word-break:break-all;">{reset_link}</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>"""
    msg.add_alternative(html, subtype="html")

    return msg


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """
    Envia e-mail de recuperação de senha via SMTP.

    Raises:
        RuntimeError: se SMTP não estiver configurado.
        smtplib.SMTPException: em caso de falha no envio.
    """
    if not settings.SMTP_HOST:
        raise RuntimeError(
            "SMTP não configurado. Defina SMTP_HOST, SMTP_USERNAME e SMTP_PASSWORD."
        )

    msg = _build_reset_email(to_email, reset_link)

    try:
        if settings.SMTP_USE_SSL:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            if settings.SMTP_USE_TLS:
                server.starttls()

        if settings.SMTP_USERNAME:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)

        server.send_message(msg)
        server.quit()
        logger.info("E-mail de reset enviado para %s", to_email)
    except smtplib.SMTPException:
        logger.exception("Falha ao enviar e-mail de reset para %s", to_email)
        raise
