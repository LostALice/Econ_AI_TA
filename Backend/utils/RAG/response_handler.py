# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.model.RAG.response_handler import (
    AFSConfig,
    OLLAMAConfig,
    OpenaiConfig,
    DeployModel,
    ConversationMessagesModel,
    MessageModel,
    ImagesContentModel,
    ImageURLModel,
    TextContentModel,
)
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.RAG.prompt import PROMPT

from ollama import Client
from openai import OpenAI

from typing import Literal, Union, Optional
from pprint import pformat
from os import getenv

import requests  # type: ignore
import json

# development
if getenv("DEBUG") == None:
    from dotenv import load_dotenv

    load_dotenv("./.env")


class ResponseHandler(object):
    """https://docs.twcc.ai/docs/user-guides/twcc/afs/api-and-parameters/conversation-api"""

    def __init__(self) -> None:
        mode = getenv("LLM_DEPLOY_MODE")

        assert (
            mode is not None
            and mode != ""
            and mode in ["local", "openai", "ollama", "afs"]
        ), "LLM_DEPLOY_MODE environment variable is not set or not valid"

        self.LLM_DEPLOY_MODE = DeployModel(mode=mode).mode

        self.logger = CustomLoggerHandler(__name__).setup_logging()
        self.logger.debug(f"LLM DEPLOY MODE: {self.LLM_DEPLOY_MODE}")
        self.Responser: Union[
            AFSResponser,
            OpenaiCompatibleResponser,
            OllamaResponser,
            OpenAIResponser,
            # LocalResponser,
        ]

        if self.LLM_DEPLOY_MODE == "ollama":
            self.Responser = OllamaResponser()

        elif self.LLM_DEPLOY_MODE == "openai_compatible":
            self.Responser = OpenaiCompatibleResponser()

        # elif self.LLM_DEPLOY_MODE == "local":
        #     self.Responser = LocalResponser()

        elif self.LLM_DEPLOY_MODE == "openai":
            self.Responser = OpenAIResponser()

        elif self.LLM_DEPLOY_MODE == "afs":
            self.Responser = AFSResponser()
        else:
            self.logger.error(f"Invalid LLM_DEPLOY_MODE: {self.LLM_DEPLOY_MODE}")
            raise ValueError("Invalid LLM_DEPLOY_MODE")

        self.Responser.initialization()

    def override_deploy_mode(
        self, deploy_mode: Literal["local", "openai", "ollama", "afs"]
    ) -> bool:
        """
        Override the current LLM deployment mode.

        This function allows changing the Large Language Model (LLM) deployment mode
        at runtime, providing flexibility in how the model is accessed or deployed.

        Args:
            deploy_mode (LLM_DEPLOY_MODE_MODEL): The new deployment mode to set.
                This should be one of the valid deployment modes defined in
                the LLM_DEPLOY_MODE_MODEL enum.

        Returns:
            bool: True if the deployment mode was successfully changed, False otherwise.

        Raises:
            ValueError: If an invalid deployment mode is provided.
        """

        self.LLM_DEPLOY_MODE_MODEL = deploy_mode

        if self.LLM_DEPLOY_MODE == "ollama":
            self.Responser = OllamaResponser()
            self.Responser.initialization()

        # elif self.LLM_DEPLOY_MODE == "openaiCompatible":
        #     self.Responser = OpenaiCompatibleResponser()
        #     self.Responser.initialization()

        # elif self.LLM_DEPLOY_MODE == "local":
        #     self.Responser = LocalResponser()
        #     self.Responser.initialization()

        elif self.LLM_DEPLOY_MODE == "openai":
            self.Responser = OpenAIResponser()
            self.Responser.initialization()

        elif self.LLM_DEPLOY_MODE == "afs":
            self.Responser = AFSResponser()
            self.Responser.initialization()

        else:
            self.logger.error(f"Invalid LLM_DEPLOY_MODE: {self.LLM_DEPLOY_MODE}")
            return False

        return True

    def generate_response(
        self,
        question: list[str],
        queried_document: list[str],
        images: Optional[list[str] | None] = None,
        question_type: Literal["CHATTING", "TESTING", "THEOREM"] = "CHATTING",
        language: Literal["ENGLISH", "CHINESE"] = "CHINESE",
        max_tokens: int = 8192,
        temperature: float = 0.6,
        top_k: int = 30,
        top_p: int = 1,
        frequence_penalty: int = 1,
    ) -> tuple[str, int]:
        conversation = self._format_conversation_messages(
            chat_history=question,
            language=language,
            question_type=question_type,
            queried_document=queried_document,
        )

        self.logger.debug(pformat(conversation.model_dump(mode="python")))

        answer, token = self.Responser.response(
            conversation=conversation,
            max_tokens=max_tokens,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            frequence_penalty=frequence_penalty,
            images=images,
        )

        self.logger.debug(f"Response: {answer} ,Token count: {token}")

        return answer, token

    def _format_conversation_messages(
        self,
        queried_document: list[str],
        chat_history: list[str] = [""],
        language: Literal["ENGLISH", "CHINESE"] = "CHINESE",
        question_type: Literal["CHATTING", "TESTING", "THEOREM"] = "CHATTING",
        # ) -> list[dict[str, Union[str, list[dict[str, Union[str, dict[str, str]]]]]]]:
    ) -> ConversationMessagesModel:
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
        system_content = PROMPT[language][question_type]["system"]
        assistant_content = PROMPT[language][question_type]["assistant"]

        # list[dict[str, Union[str, list[dict[str, Union[str, dict[str, str]]]]]]]
        # [
        #     {
        #         "role": "system",
        #         "content": system_content,
        #     },
        #     {
        #         "role": "assistant",
        #         "content": assistant_content,
        #     },
        #     {
        #         "role": "user",
        #         "content": [
        #             {
        #                 "type": "text",
        #                 "text": "human_message_content",
        #             },
        #             {
        #                 "type": "image_url",
        #                 "image_url": {
        #                     "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg",
        #                 },
        #             },
        #             {
        #                 "type": "image_url",
        #                 "image_url": {"url": "data:image/jpeg;base64,{base64_image}"},
        #             },
        #         ],
        #     },
        #     {
        #         "role": "assistant",
        #         "content": [
        #             {
        #                 "type": "text",
        #                 "text": "chats",
        #             }
        #         ],
        #     },
        # ]

        # conversation_messages: list[
        #     dict[str, Union[str, list[dict[str, Union[str, dict[str, str]]]]]]
        # ] = [
        #     {
        #         "role": "system",
        #         "content": system_content,
        #     },
        #     {
        #         "role": "assistant",
        #         "content": assistant_content,
        #     },
        # ]

        conversation_messages: ConversationMessagesModel = ConversationMessagesModel(
            message=[
                MessageModel(
                    role="system",
                    content=[TextContentModel(type="text", text=system_content)],
                ),
                MessageModel(
                    role="assistant",
                    content=[TextContentModel(type="text", text=assistant_content)],
                ),
            ]
        )

        if len(chat_history) == 1:
            human_content = PROMPT[language][question_type]["user"]
            search_documents = "".join(queried_document)
            human_message_content = human_content.format(
                question=chat_history[-1],
                search_documents=search_documents,
            )

            # conversation_messages.append(
            #     {"role": "user", "content": human_message_content}
            # )

            conversation_messages.message.append(
                MessageModel(
                    role="user",
                    content=[TextContentModel(type="text", text=human_message_content)],
                )
            )
        else:
            for i, chats in enumerate(chat_history):
                # first question = user question
                # second question = RAG response, so on
                # odd number = user question
                # even number = RAG response
                role = ["user", "assistant"]
                # conversation_messages.append(
                #     {
                #         "role": role[i % 2],
                #         "content": [
                #             {
                #                 "type": "text",
                #                 "text": chats,
                #             }
                #         ],
                #     }
                # )

                conversation_messages.message.append(
                    MessageModel(
                        role=role[i % 2],
                        content=[TextContentModel(type="text", text=chats)],
                    )
                )

        return conversation_messages


class AFSResponser(object):
    def __init__(self) -> None: ...
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


class OpenaiCompatibleResponser(object):
    def __init__(self) -> None:
        self.logger = CustomLoggerHandler(__name__).setup_logging()

    def initialization(self) -> None: ...
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
        return "", 0


class OllamaResponser(object):
    def __init__(self) -> None:
        self.logger = CustomLoggerHandler(__name__).setup_logging()

    def initialization(self) -> None:
        _ollama_host = getenv("OLLAMA_HOST")
        _ollama_port = getenv("OLLAMA_PORT")
        _ollama_model_name = getenv("OLLAMA_MODEL_NAME")

        assert not _ollama_host is None, "Environment variable OLLAMA_HOST not set"
        assert not _ollama_port is None, "Environment variable OLLAMA_PORT not set"
        assert not _ollama_model_name is None, (
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
        self.logger.info(conversation)
        response = self.ollama_client.chat(
            model=self.ollama_model_name,
            messages=conversation.model_dump(mode="python")["message"],
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


class OpenAIResponser(object):
    def __init__(self) -> None:
        self.logger = CustomLoggerHandler(__name__).setup_logging()
        self.client = OpenAI()

    def initialization(self) -> None:
        _openai_api_key = getenv("OPENAI_API_KEY")
        _openai_model_name = getenv("OPENAI_MODEL_NAME")

        assert not _openai_api_key is None, (
            "Environment variable OPENAI_API_KEY not set"
        )
        assert not _openai_model_name is None, (
            "Environment variable OPENAI_MODEL_NAME not set"
        )

        self.openai_config = OpenaiConfig(
            openai_api_key=_openai_api_key,
            openai_model_name=_openai_model_name,
        )

        self.openai_model_name = self.openai_config.openai_model_name
        self.openai_api_key = self.openai_config.openai_api_key

        # try:
        #     self.openai_client = self.client.completions.create(
        #         model=self.openai_model_name,
        #     )
        # except Exception as e:
        #     self.logger.error(f"Failed to initialize OpenAI client: {e}")

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
        if images:
            for base64_image in images:
                conversation.message[-1].content.append(
                    ImagesContentModel(
                        type="image_url",
                        image_url=ImageURLModel(
                            url=f"data:image/jpeg;base64,{base64_image}"
                        ),
                    )
                )

        response = self.client.chat.completions.create(
            model=self.openai_model_name,
            messages=conversation.model_dump(mode="python")["message"],
            frequency_penalty=frequence_penalty,
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
        )
        response_dump = response.model_dump(mode="python")

        self.logger.debug(pformat(response_dump))

        if not response:
            self.logger.error("Failed to generate OpenAI response")
            return "", 0

        token_count = response_dump["usage"]["total_tokens"] or 0
        message_dump = response.choices[0].message.model_dump(mode="python")

        return str(message_dump["content"]), token_count


# class LocalResponser(object):
#     def __init__(self) -> None:
#         self.logger = CustomLoggerHandler(__name__).setup_logging()
#     def initialization(self) -> None:
#
#     def response(
#         self,
#         conversation: list[dict[str, str]],
#         images: Optional[list[str] | None] = None,
#         max_tokens: int = 8192,
#         temperature: float = 0.6,
#         top_k: int = 30,
#         top_p: int = 1,
#         frequence_penalty: int = 1,
#     ) -> tuple[str, int]:
#         return "", 0
