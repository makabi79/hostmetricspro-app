from functools import lru_cache
import json
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "HostMetricsPro API"
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-this-to-a-long-random-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(
        default=1440,
        alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )
    database_url: str = "sqlite:///./hostmetricspro.db"
    backend_cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
    app_base_url: str = "http://localhost:3000"
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        populate_by_name=True,
    )

    @field_validator("backend_cors_origins", mode="before")
    @classmethod
    def split_cors(cls, value):
        if value is None or value == "":
            return [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
            ]

        if isinstance(value, list):
            return [str(item).strip().rstrip("/") for item in value if str(item).strip()]

        if isinstance(value, str):
            raw = value.strip()

            if not raw:
                return [
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                ]

            if raw.startswith("["):
                try:
                    parsed = json.loads(raw)
                    if isinstance(parsed, list):
                        return [
                            str(item).strip().rstrip("/")
                            for item in parsed
                            if str(item).strip()
                        ]
                except json.JSONDecodeError:
                    pass

            return [
                item.strip().strip('"').strip("'").rstrip("/")
                for item in raw.split(",")
                if item.strip()
            ]

        return value

    @field_validator("app_base_url", mode="before")
    @classmethod
    def normalize_app_base_url(cls, value):
        if isinstance(value, str):
            return value.strip().rstrip("/")
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()