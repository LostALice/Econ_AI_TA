# Code by AkinoAlice@TyrantRey

from Backend.api.v1 import (
    authorization,
    chatroom,
    documentation,
    mock,
    admin,
    result,
    management,
)
from Backend.utils.helper.logger import CustomLoggerHandler

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request

import os
import time

# logging setup
logger = CustomLoggerHandler().get_logger()

# fastapi app setup
app = FastAPI()

# development
GLOBAL_DEBUG_MODE = os.getenv("DEBUG")
logger.info("Global Debug Mode: %s", GLOBAL_DEBUG_MODE)


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")


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

assert CORS_env_value is not None, (
    "Environment variable CORS_ALLOWED_ORIGIN is not set."
)
assert isinstance(CORS_env_value, str), (
    "Invalid environment variable CORS_ALLOWED_ORIGIN"
)

CORS_allow_origins = CORS_environmental_handler(CORS_env_value)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
)

app.include_router(
    authorization.router,
    prefix="/api/v1/authorization",
    tags=["Authorization", "v1"],
)
logger.debug("| Authorization Loading Finished |")

app.include_router(
    chatroom.router,
    prefix="/api/v1/chatroom",
    tags=["Chatroom", "v1"],
)
logger.debug("| Chatroom Loading Finished |")

app.include_router(
    documentation.router,
    prefix="/api/v1/documentation",
    tags=["Documentation", "v1"],
)
logger.debug("| Documentation Loading Finished |")

app.include_router(
    mock.router,
    prefix="/api/v1/mock",
    tags=["Mock", "v1"],
)
logger.debug("| Mock Loading Finished |")

app.include_router(
    admin.router,
    prefix="/api/v1/admin",
    tags=["Admin", "v1"],
)
logger.debug("| Admin Loading Finished |")

app.include_router(
    result.router,
    prefix="/api/v1/result",
    tags=["Result", "v1"],
)
logger.debug("| Result Loading Finished |")

app.include_router(
    management.router,
    prefix="/api/v1/management",
    tags=["Management", "v1"],
)
logger.debug("| Management Loading Finished |")

logger.debug("| Backend Loading Finished |")


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


@app.get("/", status_code=200)
async def test() -> int:
    return 200

    # development only
    # uvicorn main:app --reload --host 0.0.0.0 --port 8080
    # fastapi dev main.py
