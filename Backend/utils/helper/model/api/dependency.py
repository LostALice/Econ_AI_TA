# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel


class JWTPayload(BaseModel):
    expire_time: str
    role_name: str
    username: str
    user_id: int
