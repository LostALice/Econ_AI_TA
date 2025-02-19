# Code by AkinoAlice@TyrantRey

from Backend.api.v1 import authorization, chatroom, documentation
from Backend.utils.helper.logger import CustomLoggerHandler

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI

import os
import json

if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv("./.env")

# logging setup
logger = CustomLoggerHandler(__name__).setup_logging()

# fastapi app setup
app = FastAPI()


def CORS_environmental_handler(cors_allowed_origin: str) -> list[str]:
    default_origin = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ]

    default_origin.extend([item.strip() for item in cors_allowed_origin.split(",")])
    return default_origin


CORS_env_value = os.getenv("CORS_ALLOWED_ORIGIN")

assert CORS_env_value != None, "Environment variable CORS_ALLOWED_ORIGIN is not set."
assert isinstance(
    CORS_env_value, str
), "Invalid environment variable CORS_ALLOWED_ORIGIN"

CORS_allow_origins = CORS_environmental_handler(CORS_env_value)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    authorization.router,
    prefix="/api/v1",
    tags=["Authorization", "v1"],
)
app.include_router(
    chatroom.router,
    prefix="/api/v1",
    tags=["Chatroom", "v1"],
)
app.include_router(
    documentation.router,
    prefix="/api/v1",
    tags=["Documentation", "v1"],
)

logger.debug("============================")
logger.debug("| Backend Loading Finished |")
logger.debug("============================")


@app.get("/", status_code=200)
async def test() -> int:
    return 200

    # development only
    # uvicorn main:app --reload --host 0.0.0.0 --port 8080
    # fastapi dev main.py
