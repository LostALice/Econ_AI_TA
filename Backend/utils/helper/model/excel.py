# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel


class ValidatedQuestionModel(BaseModel):
    question_no: int
    chapter_no: str
    question_text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    explanation: str
    picture: bytes | None


class QuestionDetail(BaseModel):
    question_no: int
    chapter_no: int
    number: int
    full_text: str


class ResultModel(BaseModel):
    success: bool
    updated_count: int
    deleted_count: int
    error: str
