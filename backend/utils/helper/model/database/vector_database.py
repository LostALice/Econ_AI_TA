# Code by AkinoAlice@TyrantRey

from pydantic import BaseModel


class SearchSimilarityModel(BaseModel):
    source: str
    content: str
    file_uuid: str
