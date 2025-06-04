# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.RAG.response_handler import (
    AFSConfig,
    ConversationMessagesModel,
)
from Backend.utils.helper.logger import CustomLoggerHandler

from typing import Optional
from os import getenv

import requests  # type: ignore
import json

# development
GLOBAL_DEBUG_MODE = getenv("DEBUG")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")


class AFSResponser:
    """https://docs.twcc.ai/docs/user-guides/twcc/afs/api-and-parameters/conversation-api"""

    def __init__(self) -> None:
        self.logger = CustomLoggerHandler().get_logger()

    def initialization(self) -> None:
        _afs_url = str(getenv("AFS_API_URL"))
        _afs_api_key = str(getenv("AFS_API_KEY"))
        _afs_model_name = str(getenv("AFS_MODEL_NAME"))

        self.AFS_config = AFSConfig(
            afs_url=_afs_url + "/models/conversation",
            afs_api_key=_afs_api_key,
            afs_model_name=_afs_model_name,
        )

        self.url = self.AFS_config.afs_url
        self.api_key = self.AFS_config.afs_api_key
        self.model_name = self.AFS_config.afs_model_name

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
        """
        Generate a response using Retrieval-Augmented Generation (RAG).

        Args:
            question (list[str]): List of questions or conversation history.
            queried_document (list[str]): List of retrieved documents to provide context.
            question_type (Literal["CHATTING", "TESTING", "THEOREM"], optional):
                Type of question/interaction. Defaults to "CHATTING".
            language (Literal["ENGLISH", "CHINESE"], optional):
                Language of the response. Defaults to "CHINESE".
            max_tokens (int, optional): Maximum number of tokens for the response.
                Defaults to 8192.

        Returns:
            tuple[str, int]: A tuple containing:
                - Generated text response
                - Number of prompt tokens used

        Raises:
            requests.RequestException: If there's an error with the API request.
            ValueError: If the API response is invalid or missing expected data.
        """

        headers = {
            "Content-Type": "application/json",
            "X-API-HOST": "afs-inference",
            "X-API-KEY": self.api_key,
        }

        data = {
            "model": self.model_name,
            "messages": conversation,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": temperature,
                "top_k": top_k,
                "top_p": top_p,
                "frequence_penalty": frequence_penalty,
            },
        }

        response = requests.post(self.url, headers=headers, data=json.dumps(data))
        response_data = response.json()
        return response_data.get("generated_text").replace("**", ""), response_data.get(
            "prompt_tokens"
        )
