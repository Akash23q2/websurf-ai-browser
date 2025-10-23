## imports ##
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import declarative_base
Base = declarative_base()
from typing import Any, Dict, List
from app.models.auth_data import Auth
from app.schemas.auth_schema import UserData
from sqlalchemy.orm import Session
## database engine and session ##
from app.config import DATABASE_URL
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

## methods ##

async def create_tables():
    """ Create all tables from Base metadata """
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

async def drop_tables():
    """ Drop all tables from Base metadata """
    Base.metadata.drop_all(bind=engine)
    print("Tables dropped successfully.")

async def get_db():
    """ Yield a database session """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def add_record(db: Session, record: Any):
    """ Add a new record to database """
    try:
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Error adding record: {e}")
        return None
        
async def get_userid(db: Session, model:Any,username: str):
    """ Fetch user id by username """
    user_record = db.query(Auth).filter(Auth.username == username).first()
    if user_record:
        return user_record.id
    else:
        return None

async def get_record_by_id(db: Session, model: Any, record_id: int):
    """ Fetch a record by primary key id """
    try:
        return db.query(model).filter(model.id == record_id).first()
    except SQLAlchemyError as e:
        print(f"Error fetching record: {e}")
        return None

async def update_record_by_id(db: Session, model: Any, record_id: int, data: Dict):
    """ Update a record by primary key id """
    try:
        obj = db.query(model).filter(model.id == record_id).first()
        if obj:
            for key, value in data.items():
                setattr(obj, key, value)
            db.commit()
            return obj
        else:
            print(f"Record id={record_id} not found.")
            return None
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Error updating record: {e}")
        return None


async def delete_record_by_id(db: Session, model: Any, record_id: int):
    """ Delete a record by primary key id """
    try:
        obj = db.query(model).filter(model.id == record_id).first()
        if obj:
            db.delete(obj)
            db.commit()
            print(f"Record id={record_id} deleted successfully.")
            return True
        else:
            print(f"Record id={record_id} not found.")
            return False
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Error deleting record: {e}")
        return False

async def query_records(db: Session, model: Any, filters: Dict = None, limit: int = 10) -> List[Any]:
    """ Query records from a model with optional filters """
    try:
        q = db.query(model)
        if filters:
            for attr, val in filters.items():
                q = q.filter(getattr(model, attr) == val)
        return q.limit(limit).all()
    except SQLAlchemyError as e:
        print(f"Error querying records: {e}")
        return []
