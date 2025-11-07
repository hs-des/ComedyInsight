from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

from fastapi import HTTPException, status

from twilio.base.exceptions import TwilioException
from twilio.rest import Client as TwilioClient

from models import SettingsVersion
from services import latest_settings, decrypt_settings


@dataclass
class TwilioCredentials:
    account_sid: str
    auth_token: str
    from_number: str
    verify_service_sid: Optional[str]
    otp_template: str


class TwilioOTPService:
    def __init__(self, credentials: TwilioCredentials) -> None:
        self.credentials = credentials
        self.client = TwilioClient(credentials.account_sid, credentials.auth_token)

    @classmethod
    async def from_session(cls, session) -> "TwilioOTPService":
        record: Optional[SettingsVersion] = await latest_settings(session)
        if record:
            config = decrypt_settings(record)
            credentials = TwilioCredentials(
                account_sid=config.twilio.account_sid,
                auth_token=config.twilio.auth_token,
                from_number=config.twilio.phone_number,
                verify_service_sid=config.twilio.verify_service_sid,
                otp_template=config.twilio.otp_template,
            )
            return cls(credentials)

        # Fallback to environment variables
        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_FROM_NUMBER")
        verify_sid = os.getenv("TWILIO_VERIFY_SERVICE_SID")
        if not all([account_sid, auth_token, from_number]):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Twilio configuration is missing")
        credentials = TwilioCredentials(
            account_sid=account_sid,
            auth_token=auth_token,
            from_number=from_number,
            verify_service_sid=verify_sid,
            otp_template=os.getenv("TWILIO_OTP_TEMPLATE", "Your ComedyInsight verification code is {{code}}"),
        )
        return cls(credentials)

    async def send_code(self, phone_number: str, code: str, method: str = "sms") -> None:
        message = self.credentials.otp_template.replace("{{code}}", " ".join(code))
        try:
            if method == "voice":
                twiml = f"<Response><Say voice='alice'>{message}</Say></Response>"
                self.client.calls.create(
                    to=phone_number,
                    from_=self.credentials.from_number,
                    twiml=twiml,
                )
            else:
                self.client.messages.create(
                    to=phone_number,
                    from_=self.credentials.from_number,
                    body=self.credentials.otp_template.replace("{{code}}", code),
                )
        except TwilioException as exc:
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Twilio delivery failed: {exc.msg}") from exc
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Unexpected Twilio error: {exc}") from exc

