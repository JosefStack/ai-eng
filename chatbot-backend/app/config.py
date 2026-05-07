from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    allowed_origins: list[str] = ["http://localhost:5173", ]
    debug: bool = False

    class Config:
        env_file = ".env"

settings = Settings()

