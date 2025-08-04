# Code by wonmeow

from pydantic import BaseModel


class ResultModel(BaseModel):
    success: bool
    updated_count: int
    deleted_count: int
    error: str
