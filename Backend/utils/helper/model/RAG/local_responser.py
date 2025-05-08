# Code by AkinoAlice@TyrantRey

from Backend.utils.helper.logger import CustomLoggerHandler


from typing import Optional


class LocalResponser:
    def __init__(self) -> None:
        self.logger = CustomLoggerHandler().get_logger()

    def initialization(self) -> None: ...

    def response(
        self,
        conversation: list[dict[str, str]],
        images: Optional[list[str] | None] = None,
        max_tokens: int = 8192,
        temperature: float = 0.6,
        top_k: int = 30,
        top_p: int = 1,
        frequence_penalty: int = 1,
    ) -> tuple[str, int]:
        return "", 0
