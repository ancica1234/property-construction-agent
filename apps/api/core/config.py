from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = ConfigDict(extra='ignore')

    # App
    ENVIRONMENT: str = "development"
    VERSION: str = "0.1.0"

    # Database
    DATABASE_URL: str = "postgresql://pca_user:pca_pass@localhost:5432/pca_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # JWT
    JWT_SECRET: str = "change_me_to_a_long_random_string"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080  # 7 days

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # OpenAI
    OPENAI_API_KEY: str = ""

    model_config = ConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
