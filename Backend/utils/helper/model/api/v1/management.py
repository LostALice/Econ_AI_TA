# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel


class UserModel(BaseModel):
    user_id: int
    username: str
    role_name: str

class ClassModel(BaseModel):
    class_id: int
    classname: str