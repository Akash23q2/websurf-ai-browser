## imports ##
from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.models.auth_data import Auth
from app.models.user_data import User
from app.schemas.auth_schema import SignUp, Token, UserData
from app.services.auth_service import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
)
from app.services.db import get_db
from app.services.db import update_record_by_id,get_userid

auth_router = APIRouter(tags=["Authentication"])

## routes ##

## signup route ##
@auth_router.post("/signup", response_model=dict)
# async def signup(user: Annotated[SignUp,Depends()], db: Session = Depends(get_db)):
async def signup(user: SignUp, db: Session = Depends(get_db)):    # check if username/email exists
    existing = db.query(Auth).filter(Auth.username==user.username).first()
    if existing:
        raise HTTPException(400, "Username already exists")
    
    hashed_password = await get_password_hash(user.password.get_secret_value())
    
    # Create User and Auth objects and link them
    new_user = User(
        name=user.name,
        age=user.age,
        location=user.location,
        gender=user.gender
    )
    new_auth = Auth(
        username=user.username,
        email=user.email,
        password=hashed_password,
        user=new_user  # Link the user object here
    )
    db.add(new_auth)
    db.commit()
    
    return {"msg": "User created successfully"}



@auth_router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    # login endpoint to get JWT token
    user = await authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    # The user object from authenticate_user is now a User model instance
    # We need the username from the related Auth model.
    access_token = await create_access_token(data={"sub": user.auth.username}, expires_delta=access_token_expires)
    return Token(access_token=access_token, token_type="bearer")

@auth_router.get("/users/me/", response_model=UserData)
async def read_users_me(
    current_user: Annotated[UserData, Depends(get_current_user)]
):
    # get current logged-in user info
    return current_user

@auth_router.put("/update_profile", response_model=UserData)
async def update_user_info(
    user_update: UserData,
    current_user: UserData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # update current logged-in user info
    # user_id = current_user.id
    existing = db.query(Auth).filter(Auth.username==user_update.username).first()
    if not existing:
        raise HTTPException(400, "Username doesnot exists")
    return await update_record_by_id(db,User,existing.id,user_update.model_dump())
