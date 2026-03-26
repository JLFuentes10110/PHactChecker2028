import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

# Determine which env file to use at runtime
# Set PH_ENV="test" in your terminal to use .env.test
_env_file = ".env.test" if os.getenv("PH_ENV") == "test" else ".env"

class Settings(BaseSettings):
    # Core App Settings
    PROJECT_NAME: str = "PHactChecker 2028"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    ENVIRONMENT: str = "development" # Set to 'production' in your Supabase .env

    # Database
    DATABASE_URL: str

    # AI Keys
    GROQ_API_KEY: str
    TAVILY_API_KEY: str

    # --- EXPLICIT ALIASES ---
    @property
    def app_name(self) -> str: return self.PROJECT_NAME

    @property
    def app_version(self) -> str: return self.VERSION

    @property
    def database_url(self) -> str: return self.DATABASE_URL

    @property
    def debug(self) -> bool: return self.DEBUG

    @property
    def groq_api_key(self) -> str: return self.GROQ_API_KEY

    @property
    def tavily_api_key(self) -> str: return self.TAVILY_API_KEY

    def model_post_init(self, __context):
        os.environ["GROQ_API_KEY"] = self.GROQ_API_KEY
        os.environ["TAVILY_API_KEY"] = self.TAVILY_API_KEY

    # Dynamic env file loading
    model_config = SettingsConfigDict(
        env_file=_env_file, 
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

settings = Settings()