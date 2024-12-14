# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel

class UserInfoModel(BaseModel):
    user_id: int
    username: str
    password: str
    jwt: str
    last_login: str
    role_name: str
    
class QueryDocumentationTypeListModel(BaseModel):
    file_id: str
    file_name: str
    last_update_time: str