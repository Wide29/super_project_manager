from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Python Algorithm Service"
    app_version: str = "0.1.0"
    default_feature_version: str = "v1"
    model_config = SettingsConfigDict(env_prefix="ALGO_", extra="ignore")


settings = Settings()
