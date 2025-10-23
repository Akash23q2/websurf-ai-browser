## REQUEST/RESPONSE MODELS
from pydantic import BaseModel
from typing import List, Optional
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SessionInitRequest(BaseModel):
    user_query: str
    user_id: Optional[str] = None


class MessageRequest(BaseModel):
    session_id: str
    message: str


class UploadResourceRequest(BaseModel):
    collection_name: str
    description: str
    user_id: str


class WebSocketMessage(BaseModel):
    type: str  # 'chat', 'set_topic', 'generate_quiz', 'submit_quiz'
    session_id: str
    data: dict

class AgentRequest(BaseModel):
    mode: str
    query: Optional[str] = None

class AgentResponse(BaseModel):
    mode: str
    result: str
    summary: Optional[str] = None
    available_collections: Optional[dict] = None
    
#  Pydantic Models For Rag-routes 

class AddDocumentResponse(BaseModel):
    document_ids: List[str]
    message: str

class SearchRequest(BaseModel):
    query: str
    collection_name: str = "learning_notes"
    k: int = Field(4, gt=0, description="Number of documents to return")

class Document(BaseModel):
    page_content: str
    metadata: Dict[str, Any]

class SearchResponse(BaseModel):
    query: str
    results: List[Document]
