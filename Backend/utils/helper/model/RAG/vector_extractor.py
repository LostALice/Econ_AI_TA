# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel, Field, HttpUrl
from typing import Literal, Union


class EmbeddingDeployModel(BaseModel):
    mode: Union[str, Literal["local", "openai", "ollama", "afs"]] = Field(
        ..., min_length=1
    )


class AFSEmbeddingConfig(BaseModel):
    url: str = Field(...)
    api_key: str = Field(..., min_length=1)
    embedding_model_name: str = Field(..., min_length=1)


class OLLAMAEmbeddingConfig(BaseModel):
    ollama_host: str = Field(..., min_length=1)
    ollama_port: int = Field(..., ge=1, le=65535)
    ollama_embedding_model_name: str = Field(..., min_length=1)
