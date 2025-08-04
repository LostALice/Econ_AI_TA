# Code by wonmeow
# Modify by TyrantRey 24/7/25

from pydantic import BaseModel
from typing import Any


class FileUploadSuccessModel(BaseModel):
    file_id: str
    file_name: str
    last_update: str
    message: str
    status_code: int = 200


class FileListSuccessModel(BaseModel):
    docs_list: list[dict[str, Any]]
    status_code: int = 200


class FileDeleteSuccessModel(BaseModel):
    file_id: str
    message: str
    status_code: int = 200


class QuestionsSuccessModel(BaseModel):
    file_id: str
    file_name: str
    questions: list[dict[str, Any]]
    status_code: int = 200


class QuestionsUpdateModel(BaseModel):
    file_id: str
    questions: list[dict[str, Any]]


class QuestionsUpdateSuccessModel(BaseModel):
    file_id: str
    updated_count: int
    deleted_count: int
    message: str
    status_code: int = 200
