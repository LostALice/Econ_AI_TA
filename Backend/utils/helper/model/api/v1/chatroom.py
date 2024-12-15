# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel
from typing import Literal


class RatingModel(BaseModel):
    question_uuid: str
    rating: bool


class AnswerRatingModel(BaseModel):
    status_code: int
    success: bool


class QuestioningModel(BaseModel):
    chat_id: str
    question: list[str]
    user_id: str
    language: Literal["CHINESE", "ENGLISH"] = "CHINESE"
    collection: str = "default"


class QuestionResponseModel(BaseModel):
    status_code: int
    question_uuid: str
    answer: str
    files: list[dict[str, str]]
