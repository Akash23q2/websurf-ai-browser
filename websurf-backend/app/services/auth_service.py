## imports ##
from datetime import datetime, timedelta, timezone
from typing import Annotated
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy.orm import Session
from dotenv import load_dotenv, find_dotenv
import os
from app.services.db import get_db
from app.models.auth_data import Auth
from app.models.user_data import User
from app.schemas.auth_schema import UserData,AuthData

## load env ##
load_dotenv(dotenv_path=find_dotenv())

## secret constants ##
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
# REFRESH_TOKEN_EXPIRE_MINUTES = int(os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES"))

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

## methods ##
async def verify_password(plain_password, hashed_password):
    # verify plain password against hashed
    return password_hash.verify(plain_password, hashed_password)

async def get_password_hash(password):
    # hash a password
    return password_hash.hash(password)

async def get_user_from_db(username: str, db: Session):
    # fetch a user from database by username
    auth_record = db.query(Auth).filter(Auth.username == username).first()
    if auth_record and auth_record.user:
        return UserData(
            username=auth_record.username,
            name=auth_record.user.name,
            age=auth_record.user.age,
            location=auth_record.user.location,
            gender=auth_record.user.gender,            # other fields
        )
    return None

async def authenticate_user(db: Session, username: str, password: str):
    # authenticate user using real DB
    user_record = db.query(Auth).filter(Auth.username == username).first()
    if not user_record:
        return False
    if not await verify_password(password, user_record.password):
        return False
    return user_record.user

async def create_access_token(data: dict, expires_delta: timedelta | None = None):
    # create JWT access token
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
):
    # get current user from token
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception

    user = await get_user_from_db(username, db)
    if user is None:
        raise credentials_exception
    return user

# async def get_current_active_user(
#     current_user: Annotated[UserData, Depends(get_current_user)]
# ):
#     # ensure user is active
#     if current_user.disabled:
#         raise HTTPException(status_code=400, detail="Inactive user")
#     return current_user
