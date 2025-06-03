# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel
from Backend.utils.helper.model.api.v1.mock import ExamType


class MockResult(BaseModel):
    submission_id: int
    exam_id: int
    user_id: int
    exam_name: str
    exam_type: ExamType
    exam_date: str
    score: int
    total_question: int