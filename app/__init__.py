from app.services.db import engine, Base  # or adjust import paths as per your structure
from app.models import auth_data, user_data   # important: import all models before create_all()

Base.metadata.create_all(bind=engine)
