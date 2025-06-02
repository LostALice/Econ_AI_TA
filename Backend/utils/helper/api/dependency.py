# Code by AkinoAlice@TyrantRey

from fastapi import Depends, HTTPException, Cookie

import jwt
import os
import datetime

from Backend.utils.database.database import MySQLHandler
from Backend.utils.helper.logger import CustomLoggerHandler
from Backend.utils.helper.model.api.dependency import JWTPayload

from typing import Annotated

# Initialize logger and database connection
logger = CustomLoggerHandler().get_logger()
mysql_client = MySQLHandler()

# development
GLOBAL_DEBUG_MODE = os.getenv("DEBUG")


if GLOBAL_DEBUG_MODE is None or GLOBAL_DEBUG_MODE == "True":
    from dotenv import load_dotenv

    load_dotenv("./.env")


# async def get_jwt_token(jwt: str | None = Cookie(None)) -> str:
#     """Extract JWT token from the Authorization header"""
#     logger.info("Token: %s", jwt)

#     if jwt is None:
#         raise HTTPException(status_code=401, detail="Missing authorization header")

#     token_parts = jwt.split()

#     if len(token_parts) != 2 or token_parts[0].lower() != "bearer":
#         raise HTTPException(
#             status_code=401, detail="Invalid authorization header format"
#         )

#     return token_parts[1]


async def verify_jwt_token(token: str = Cookie(None)) -> JWTPayload:
    """
    Verify the JWT token and extract the payload.

    Args:
        token (str): The JWT token extracted from the Authorization Cookie.

    Returns:
        JWTPayload: The decoded JWT payload containing user information.

    Raises:
        HTTPException: If the token is invalid, expired, or not found in the database.
    """
    jwt_secret = str(os.getenv("JWT_SECRET"))
    jwt_algorithm = os.getenv("JWT_ALGORITHM")

    assert jwt_secret is not None, "Missing JWT_SECRET environment variable"
    assert jwt_algorithm in [
        "HS256",
        "HS384",
        "HS512",
        "ES256",
        "ES256K",
        "ES384",
        "ES512",
        "RS256",
        "RS384",
        "RS512",
        "PS256",
        "PS384",
        "PS512",
        "EdDSA",
    ], "Missing JWT_ALGORITHM environment variable"

    logger.debug(token)
    if not jwt_secret:
        raise HTTPException(status_code=500, detail="JWT secret not configured")

    try:
        # Decode the JWT token

        payload = jwt.decode(token, jwt_secret, algorithms=jwt_algorithm)

        # Verify token is in database
        is_token_valid = mysql_client.verify_login_token(payload["user_id"], token)
        logger.info(is_token_valid)
        if not is_token_valid:
            raise HTTPException(status_code=401, detail="Token not found in database")

        # Check if token is expired
        expire_time = datetime.datetime.fromisoformat(payload["expire_time"])
        if datetime.datetime.now() > expire_time:
            # Optionally remove expired token from database
            mysql_client.remove_expired_token(payload["user_id"])
            raise HTTPException(status_code=401, detail="Token expired")

        return JWTPayload(**payload)

    except jwt.PyJWTError as e:
        logger.error(f"JWT verification error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {str(e)}")
        raise HTTPException(status_code=401, detail="Internal server error")


async def require_role(
    required_roles: list[str], payload: JWTPayload = Depends(verify_jwt_token)
) -> JWTPayload:
    """
    Check if the authenticated user has one of the required roles.

    Args:
        required_roles (list[str]): List of roles that are allowed to access the endpoint.
        payload (JWTPayload): The JWT payload from the verify_jwt_token dependency.

    Returns:
        JWTPayload: The original JWT payload if the role check passes.

    Raises:
        HTTPException: If the user's role is not in the required roles list.
    """
    logger.info(payload.role_name)
    if payload.role_name.lower() not in required_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    return payload


async def require_root(payload: JWTPayload = Depends(verify_jwt_token)) -> JWTPayload:
    """Require root role to access the endpoint"""
    return await require_role(["root"], payload)


async def require_admin(payload: JWTPayload = Depends(verify_jwt_token)) -> JWTPayload:
    """Require admin role to access the endpoint"""
    return await require_role(["admin", "root"], payload)


async def require_student(
    payload: JWTPayload = Depends(verify_jwt_token),
) -> JWTPayload:
    """Require user role to access the endpoint"""
    return await require_role(["student", "teacher", "ta", "root", "admin"], payload)


async def require_ta(payload: JWTPayload = Depends(verify_jwt_token)) -> JWTPayload:
    """Require user role to access the endpoint"""
    return await require_role(["teacher", "ta", "root", "admin"], payload)


async def require_teacher(
    payload: JWTPayload = Depends(verify_jwt_token),
) -> JWTPayload:
    """Require user role to access the endpoint"""
    return await require_role(["root", "admin", "teacher"], payload)


UserPayload = Annotated[JWTPayload, Depends(require_student)]
TAPayload = Annotated[JWTPayload, Depends(require_ta)]
TeacherPayload = Annotated[JWTPayload, Depends(require_teacher)]
