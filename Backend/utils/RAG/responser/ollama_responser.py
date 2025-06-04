# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.RAG.response_handler import (
    OLLAMAConfig,
    ConversationMessagesModel,
)
from Backend.utils.helper.logger import CustomLoggerHandler

from ollama import Client

from typing import Optional
from pprint import pformat
from os import getenv

# development
GLOBAL_DEBUG_MODE = getenv("DEBUG")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")


class OllamaResponser:
    def __init__(self) -> None:
        self.logger = CustomLoggerHandler().get_logger()

    def initialization(self) -> None:
        _ollama_host = getenv("OLLAMA_HOST")
        _ollama_port = getenv("OLLAMA_PORT")
        _ollama_model_name = getenv("OLLAMA_MODEL_NAME")

        assert _ollama_host is not None, "Environment variable OLLAMA_HOST not set"
        assert _ollama_port is not None, "Environment variable OLLAMA_PORT not set"
        assert _ollama_model_name is not None, (
            "Environment variable OLLAMA_MODEL_NAME not set"
        )

        self.ollama_config = OLLAMAConfig(
            ollama_host=_ollama_host,
            ollama_port=int(_ollama_port),
            ollama_model_name=_ollama_model_name,
        )

        self.ollama_host = self.ollama_config.ollama_host
        self.ollama_port = self.ollama_config.ollama_port
        self.ollama_model_name = self.ollama_config.ollama_model_name
        self.ollama_host_url = f"{self.ollama_host}:{self.ollama_port}"

        try:
            self.ollama_client = Client(
                host=self.ollama_host_url,
            )
        except Exception as e:
            self.logger.error(f"Failed to initialize OLLAMA client: {e}")

    def response(
        self,
        conversation: ConversationMessagesModel,
        images: Optional[list[str] | None] = None,
        max_tokens: int = 8192,
        temperature: float = 0.6,
        top_k: int = 30,
        top_p: int = 1,
        frequence_penalty: int = 1,
    ) -> tuple[str, int]:
        ollama_conversation = conversation.model_dump(mode="python")["message"]
        self.logger.info(pformat(conversation))

        # Convert ConversationMessagesModel to ollama format
        for i, x in enumerate(ollama_conversation):
            self.logger.info(x)
            ollama_conversation[i]["content"] = x["content"][0]["text"]

        response = self.ollama_client.chat(
            model=self.ollama_model_name,
            messages=ollama_conversation,
            options={
                "max_tokens": max_tokens,
                "temperature": temperature,
                "top_k": top_k,
                "top_p": top_p,
                "frequency_penalty": frequence_penalty,
            },
        )

        if not response.message.content:
            self.logger.error("Failed to generate OLLAMA response")
            return "", 0
        if not response.prompt_eval_count:
            self.logger.error("Failed to generate OLLAMA response")
            return "", 0

        return response.message.content, response.prompt_eval_count
