# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel, Field, HttpUrl
from typing import Literal, Union


class DeployModel(BaseModel):
    mode: Union[str, Literal["local", "openai", "ollama", "afs"]] = Field(
        ..., min_length=1
    )


class ChatConfig(BaseModel): ...


class OllamaChatConfig(BaseModel):
    seed: int
    top_k: int
    top_p: float
    min_p: int
    temperature: int
    stop: list[str]
    num_keep: int
    num_predict: int
    typical_p: int
    repeat_last_n: int
    repeat_penalty: int
    presence_penalty: int
    frequency_penalty: int
    mirostat: int
    mirostat_tau: int
    mirostat_eta: int
    penalize_newline: bool
    numa: bool
    num_ctx: int
    num_batch: int
    num_gpu: int
    main_gpu: int
    low_vram: bool
    vocab_only: bool
    use_mmap: bool
    use_mlock: bool
    num_thread: int


class AFSConfig(BaseModel):
    afs_url: str = Field(...)
    afs_api_key: str = Field(..., min_length=1)
    afs_model_name: str = Field(..., min_length=1)


class OLLAMAConfig(BaseModel):
    ollama_host: str = Field(..., min_length=1)
    ollama_port: int = Field(..., ge=1, le=65535)
    ollama_model_name: str = Field(..., min_length=1)
