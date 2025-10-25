##imports##
from datetime import datetime, timedelta, timezone
from fastapi import Depends,FastAPI,APIRouter
from app.routes.auth_routes import auth_router
from app.routes.agent_routes import agent_router
from app.routes.rag_routes import rag_router
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import os
import ssl
from dotenv import load_dotenv, find_dotenv

load_dotenv(dotenv_path=find_dotenv())

##routes
app=FastAPI()
app.include_router(auth_router)
app.include_router(agent_router)
app.include_router(rag_router)
# app.include_router(ws_router)

# handling https
# ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
# ssl_context.load_cert_chain(r'app/cert.pem', keyfile=r'app/key.pem')

# Add CORS middleware for WebSocket support
app.add_middleware(
    CORSMiddleware,
     allow_origins=os.getenv('BACKEND_CORS_ORIGINS', '*'),
allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def greet():
    return "Hello, World!"

if __name__=="__main__":
    uvicorn.run(
    app,
    host="0.0.0.0",
    port=8000,
    # ssl=ssl_context
)

  
# uvicorn app.app:app --reload   --> this works on terminal
