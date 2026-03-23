from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    app_name: str = "PH-FC-2028"
    app_version: str = "1.0.0"
    debug: bool = True
    database_url: str  # No default — will error clearly if not set
    supabase_url: str = ""
    supabase_key: str = ""
    groq_api_key: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()