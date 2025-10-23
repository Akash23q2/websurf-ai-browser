from pydantic import BaseModel, EmailStr,SecretStr, Field
from typing import Annotated, Optional

class AuthData(BaseModel):
    username: str = Field(..., example="johndoe")
    email: EmailStr = Field(..., example="abc@mail.com")
    password: SecretStr = Field(..., example="Strongpassword123#*")
    
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None

class UserData(BaseModel):
    username:str
    name: str
    age:int
    # api_key:str
    location:Optional[str]=None
    gender:Optional[str]=None
    
class SignUp(AuthData, UserData):
    pass #ask both fields while signing up

class UserInDB(BaseModel):
    hashed_password: str