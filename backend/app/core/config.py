from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://heit_user:heit_password@postgres:5432/heit"
    SECRET_KEY: str = "secret_key_string"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    GEMINI_API_KEY: str = ""  # Google Gemini API key (will be used for AI suggestions)

    class Config:
        env_file = ".env"

settings = Settings()
