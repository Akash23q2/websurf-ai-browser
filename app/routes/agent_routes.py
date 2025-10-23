## Imports
from fastapi import APIRouter, HTTPException
from app.schemas.response_schema import AgentRequest, AgentResponse
# from markdown import markdown   
from app.services.agent_service import (
    run_agent_task,
    AgentMode,
    SupportDependencies,
    avilable_collections,
)

## Router instance
agent_router = APIRouter(prefix="/agent", tags=["AI Agent"])

@agent_router.get("/")
async def root():
    """Health check endpoint for the agent router."""
    return {"message": "Agent router is active."}

@agent_router.post("/run", response_model=AgentResponse)
async def run_agent(request: AgentRequest):
    """
    Run AI agent in the selected mode.
    Modes:
    - RAG   : Retrieve and answer factual queries
    - TALK  : Chat conversationally 
    """
    try:
        mode = request.mode.lower()

        # PLAN mode - learning journey planner

        # RAG mode - retrieval-based Q&A
        if mode == AgentMode.RAG:
            if not request.query:
                raise HTTPException(status_code=400, detail="Query is required for RAG mode.")
            state_result = await run_agent_task(
                mode='rag',
                query=request.query
            )
            result: str = state_result
            return AgentResponse(
                mode=AgentMode.RAG,
                result=result,
                available_collections=avilable_collections
            )
        # TALK mode - conversational chat
        elif mode == AgentMode.TALK:
            if not request.query:
                raise HTTPException(status_code=400, detail="Query is required for TALK mode.")
            state_result = await run_agent_task(
                mode='talk',
                query=request.query
            )
            result: str = state_result
            return AgentResponse(
                mode=AgentMode.TALK,
                result=result,
                available_collections=avilable_collections
            )

        # Invalid mode
        else:
            raise HTTPException(status_code=400, detail=f"Invalid mode: {request.mode}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent execution failed: {str(e)}")


@agent_router.get("/collections")
async def get_available_collections():
    """Return all available RAG embedding collections."""
    try:
        if not avilable_collections:
            return {"message": "No collections available."}
        return {"available_collections": avilable_collections}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching collections: {str(e)}")


@agent_router.get("/time")
async def get_current_time():
    """Return the current system date and time."""
    return {"datetime": SupportDependencies.getCurrentDateTime()}
