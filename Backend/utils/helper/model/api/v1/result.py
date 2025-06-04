# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel
from Backend.utils.helper.model.api.v1.mock import ExamType


class MockResult(BaseModel):
    submission_id: int
    class_id: int
    classname: str
    exam_id: int
    exam_name: str
    user_id: int
    username:str
    exam_type: ExamType
    exam_date: str
    submission_time: str
    score: int
    total_question: int