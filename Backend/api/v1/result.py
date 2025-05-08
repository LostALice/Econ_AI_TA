# Code by AkinoAlice@TyrantRey

import os

from fastapi import APIRouter, Depends

from Backend.utils.helper.logger import CustomLoggerHandler

logger = CustomLoggerHandler().get_logger()

# development
GLOBAL_DEBUG_MODE = os.getenv("DEBUG")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")
    from dotenv import load_dotenv

    load_dotenv("./.env")


router = APIRouter()
