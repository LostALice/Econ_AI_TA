from Backend.utils.helper.model.RAG.response_handler import (
    OpenaiConfig,
    ConversationMessagesModel,
    ImagesContentModel,
    ImageURLModel,
)
from Backend.utils.helper.logger import CustomLoggerHandler

from openai import OpenAI

from typing import Optional
from pprint import pformat
from os import getenv

# development
GLOBAL_DEBUG_MODE = getenv("DEBUG")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")


class OpenAIResponser:
    def __init__(self) -> None:
        self.logger = CustomLoggerHandler().get_logger()
        self.client = OpenAI()

    def initialization(self) -> None:
        _openai_api_key = getenv("OPENAI_API_KEY")
        _openai_model_name = getenv("OPENAI_MODEL_NAME")

        assert _openai_api_key is not None, (
            "Environment variable OPENAI_API_KEY not set"
        )
        assert _openai_model_name is not None, (
            "Environment variable OPENAI_MODEL_NAME not set"
        )

        self.openai_config = OpenaiConfig(
            openai_api_key=_openai_api_key,
            openai_model_name=_openai_model_name,
        )

        self.openai_model_name = self.openai_config.openai_model_name
        self.openai_api_key = self.openai_config.openai_api_key

        self.client.api_key = self.openai_api_key

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
