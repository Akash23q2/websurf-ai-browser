## Agent output schemas for different modes ##
from pydantic import BaseModel

## AgentMode
class AgentMode(str):
    """Defines operational modes of the agent."""
    RAG = "rag_query"
    TALK = "talk"
    

## Base state for generic RAG responses ##
class AgentState(BaseModel):
    output: str

class SummaryState(BaseModel):
    summary: str

