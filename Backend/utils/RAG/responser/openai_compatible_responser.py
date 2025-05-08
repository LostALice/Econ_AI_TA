# Code by AkinoAlice@TyrantRey


from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.helper.model.RAG.response_handler import (
    ConversationMessagesModel,
)

from typing import Optional


class OpenaiCompatibleResponser:
    def __init__(self) -> None:
        self.logger = CustomLoggerHandler().get_logger()

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
