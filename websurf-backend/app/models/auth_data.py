from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.services.db import Base

# Auth table
class Auth(Base):
    __tablename__ = "auth_data"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True,nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    
    user = relationship("User", back_populates="auth", uselist=False, cascade="all, delete")

__export__ = ["Auth"]
