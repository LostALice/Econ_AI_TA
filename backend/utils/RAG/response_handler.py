# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.RAG.prompt import PROMPT

from typing import Literal, Optional
from pprint import pformat

import requests
import json
import os

# development
from dotenv import load_dotenv

load_dotenv("./.env")


class ResponseHandler(object):
    """https://docs.twcc.ai/docs/user-guides/twcc/afs/api-and-parameters/conversation-api"""

    def __init__(self) -> None:
        self.url = os.getenv("API_URL")
        self.api_key = os.getenv("API_KEY")
        self.model_name = os.getenv("MODEL_NAME")

        assert self.url is not None, "API_URL environment variable is not set"
        assert self.api_key is not None, "API_KEY environment variable is not set"
        assert self.model_name is not None, "MODEL_NAME environment variable is not set"

        self.url = str(self.url) + "/models/conversation"

        # logger
        self.logger = CustomLoggerHandler(__name__).setup_logging()

    def format_conversation_messages(
        self,
        queried_document: list[str],
        chat_history: list[str] = [""],
        language: Literal["ENGLISH", "CHINESE"] = "CHINESE",
        question_type: Literal["CHATTING", "TESTING", "THEOREM"] = "CHATTING",
    ) -> list[dict[str, str]]:
        """
        Format the conversation messages for the RAG system.

        Args:
            queried_document (list[str]): List of relevant documents retrieved for the query.
            chat_history (list[str], optional): Previous conversation history. Defaults to [""].
            language (Literal["ENGLISH", "CHINESE"], optional): Language for the response. Defaults to "CHINESE".
            question_type (Literal["CHATTING", "TESTING", "THEOREM"], optional): Type of prompt to generate. Defaults to "CHATTING".

        Returns:
            list[dict[str, str]]: Formatted conversation messages for RAG
        """
        system_content = PROMPT[language][question_type]["SYSTEM"]
        assistant_content = PROMPT[language][question_type]["ASSISTANT"]

        # default chat message
        message = [
            {
                "role": "system",
                "content": system_content,
            },
            {
                "role": "assistant",
                "content": assistant_content,
            },
        ]

        if len(chat_history) == 1:
            human_content = PROMPT[language][question_type]["HUMAN"]
            search_documents = "".join(queried_document)

            message.append(
                {
                    "role": "human",
                    "content": human_content.format(
                        # last
                        question=chat_history[-1],
                        search_documents=search_documents,
                    ),
                }
            )
        else:
            for i, chats in enumerate(chat_history):
                # first question = user question
                # second question = RAG response, so on
                # odd number = user question
                # even number = RAG response
                if i % 2 == 1:
                    message.append(
                        {
                            "role": "human",
                            "content": chats,
                        }
                    )
                else:
                    message.append(
                        {
                            "role": "assistant",
                            "content": chats,
                        }
                    )

        return message

    def response(
        self,
        question: list[str],
        queried_document: list[str],
        question_type: Literal["CHATTING", "TESTING", "THEOREM"] = "CHATTING",
        language: Literal["ENGLISH", "CHINESE"] = "CHINESE",
        max_tokens: int = 8192,
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

        messages = self.format_conversation_messages(
            chat_history=question,
            language=language,
            question_type=question_type,
            queried_document=queried_document,
        )

        data = {
            "model": self.model_name,
            "messages": messages,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": 0.6,
                "top_k": 30,
                "top_p": 1,
                "frequence_penalty": 1,
            },
        }

        response = requests.post(self.url, headers=headers, data=json.dumps(data))
        response_data = response.json()
        self.logger.debug(f"Response: {pformat(response_data)}")
        return response_data.get("generated_text").replace("**", ""), response_data.get(
            "prompt_tokens"
        )
