from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.services.db import Base

# User Data table
class User(Base):
    __tablename__ = "user_data"
    id = Column(Integer, ForeignKey("auth_data.id", ondelete="CASCADE"), primary_key=True)
    # api_key = Column(String(255), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer)
    location = Column(String(100))
    gender = Column(String(10))
    auth = relationship("Auth", back_populates="user")
    
__export__ = ["User"]