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
