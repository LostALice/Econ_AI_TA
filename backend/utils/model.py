# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel
from typing import Literal


class QuestioningModel(BaseModel):
    chat_id: str
    question: str
    user_id: str
    collection: str = "default"


class Departments(BaseModel):
    department_name: Literal[
        "工程與科學學院",
        "商學院",
        "人文社會學院",
        "資訊電機學院",
        "建設學院",
        "金融學院",
        "國際科技與管理學院",
        "建築專業學院",
        "創能學院",
        "通識教育中心",
        "經營管理學院",
        "行政單位",
        "研究中心",
        "其他",
    ]

class LoginFormModel(BaseModel):
    username: str
    hashed_password: str

class UserInfoModel(BaseModel):
    user_id: int
    username: str
    password: str
    jwt: str
    last_log: str
    role_nam: str


class RatingModel(BaseModel):
    question_uuid: str
    rating: bool