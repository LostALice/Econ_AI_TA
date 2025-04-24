# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel


class LoginFormModel(BaseModel):
    username: str
    hashed_password: str


class UserInfoModel(BaseModel):
    user_id: int
    username: str
    password: str
    jwt: str
    last_login: str
    role_name: str


class LoginFormUnsuccessModel(BaseModel):
    status_code: int
    success: bool
    response: int


class LoginFormSuccessModel(BaseModel):
    status_code: int
    success: bool
    jwt_token: str
    role: str


class SingUpSuccessModel(BaseModel):
    status_code: int
    success: bool
