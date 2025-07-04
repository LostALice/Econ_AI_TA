# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel
from typing import Literal, Optional


class RatingModel(BaseModel):
    question_uuid: str
    rating: bool


class AnswerRatingModel(BaseModel):
    status_code: int
    success: bool


class QuestioningModel(BaseModel):
    chat_id: str
    question: list[str]
    language: Literal["CHINESE", "ENGLISH"] = "CHINESE"
    question_type: Literal["CHATTING", "TESTING", "THEOREM"]
    collection: str = "default"
    images: Optional[list[str] | None] = None


class QuestionResponseModel(BaseModel):
    status_code: int
    question_uuid: str
    answer: str
    files: list[dict[str, str]]
