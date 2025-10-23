## Imports ##
from typing import TypedDict, Annotated, Sequence, Literal, List, Optional
from dataclasses import dataclass
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext,ModelMessage
from datetime import datetime
from app.schemas.agent_schema import AgentState, AgentMode,SummaryState
from app.services.rag_service import avilable_collections, query_engine, data_injestion
from ddgs import DDGS
import chromadb
import os
import asyncio
from dotenv import load_dotenv
import json
import asyncio

load_dotenv()
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

## Initialize AI agent ##
from pydantic_ai.models.google import GoogleModel

model = GoogleModel('gemini-2.5-flash')
agent = Agent(model,system_prompt="You are an intelligent educational assistant that helps users learn and understand topics interactively. You can teach topics, generate notes, plan learning journeys,\
                                   and answer questions using available knowledge sources.\
                                   if not provided much context just say hey\
                                   You are **WhisperNotes AI**, a friendly and knowledgeable AI tutor.**")
summarize_agent=Agent(model,system_prompt="You are a helpful assistant that summarizes conversations into concise summaries.")

SESSION_SUMMARY_HISTORY='' #Initialize empty session summary history
SESSION_LIMIT_THRESHOLD=-1 # max tokens for session history, Implement later if needed.

## Dependencies ##
@dataclass
class SupportDependencies:
    ## RAG Dependencies ##
    async def getPresentEmbeddingsInfo() -> str:
        result = []
        for key, value in avilable_collections.items():
            result.append(f"{key}: {value}\n")
        return "".join(result) if result else "No collections available in the database."

    async def getConversationSummary(query: str, n_results: int = 10) -> str:
        try:
            retrieved_text = await retrieveFromEmbeddings(
                collection_name="current_session",
                query=query,
                n_results=n_results
            )
            if "Error" in retrieved_text or "No relevant" in retrieved_text:
                return "No relevant conversation history found."
            content_start = retrieved_text.find(":\n\n")
            if content_start != -1:
                return retrieved_text[content_start + 3:]
            return retrieved_text
        except Exception as e:
            return f"Error getting conversation summary: {str(e)}"

    async def getCurrentDateTime() -> str:
        now = datetime.now()
        return f"Current date and time: {now.strftime('%Y-%m-%d %H:%M:%S')}"

## Utility Functions ##
async def format_results_for_llm(results: list) -> str:
    if not results:
        return "No search results found."
    lines = []
    for item in results:
        title = item.get('title', '').strip()
        body = item.get('body', item.get('snippet', '')).strip()
        date = item.get('date', 'N/A').strip()
        if title and body:
            formatted = f"[{date}] {title}\n{body}\n"
            lines.append(formatted)
    return "\n".join(lines) if lines else "No valid results found."

## Tools Definitions ##
@agent.tool
@summarize_agent.tool 
async def queryAllEmbeddings(ctx: RunContext[SupportDependencies], query: str, n_results: int = 5) -> str:
    """
     find information avilable in the memory,  useful to answer specific questions about the learning content. AND to find  memory of past conversations. If nothing is found, fallback to web search.
     Always try 'current_session' first, then all other embeddings, then web search.
    """
    try:
        # Always try 'current_session' first
        if 'current_session' in avilable_collections:
            result = await retrieveFromEmbeddings(ctx, collection_name='current_session', query=query, n_results=n_results)
            if result and "No relevant" not in result and "Error" not in result:
                return f"Answer from 'current_session':\n{result}"

        # Then try all other embeddings
        for collection_name in avilable_collections.keys():
            if collection_name == 'current_session':
                continue
            result = await retrieveFromEmbeddings(ctx, collection_name=collection_name, query=query, n_results=n_results)
            if result and "No relevant" not in result and "Error" not in result:
                return f"Answer from '{collection_name}' collection:\n{result}"
        
        # fallback to web search
        web_result = await searchWebTool(ctx, query=query, max_results=n_results)
        return f"No relevant embedding found. Fallback to web search:\n{web_result}"
    except Exception as e:
        return f"Error querying embeddings: {str(e)}"

@agent.tool
@summarize_agent.tool
async def retrieveFromEmbeddings(
    ctx: RunContext[SupportDependencies],
    collection_name: str,
    query: str,
    n_results: int = 5,
    db_path: str = None
) -> str:
    '''find relevant information from avilable memory content/embeddings'''
    try:
        results = await query_engine(
            collection_name=collection_name,
            query=query,
            n_results=n_results,
            db_path=db_path
        )
        formatted_results = "\n\n---\n\n".join(results)
        return f"Retrieved {len(results)} relevant chunks:\n\n{formatted_results}"
    except Exception as e:
        return f"Error retrieving from embeddings: {str(e)}"

@agent.tool
async def searchWebTool(ctx: RunContext[SupportDependencies], query: str, max_results: int = 5) -> str:
    '''perform web search to find relevant information'''
    try:
        # Run blocking DDGS call in executor to avoid blocking event loop
        loop = asyncio.get_event_loop()
        results = await loop.run_in_executor(None, lambda: list(DDGS().text(query, max_results=max_results)))
        return await format_results_for_llm(results)
    except Exception as e:
        return f"Web search unavailable (network error): {str(e)}. Please check your internet connection or try again later."

@summarize_agent.tool
async def logConversation(ctx: RunContext[SupportDependencies], user_message: str, ai_response: str) -> str:
    try:
        '''log the conversation turn to 'current_session' embedding'''
        formatted_turn = f"User: {user_message}\nAI: {ai_response}\nTimestamp: {datetime.now().isoformat()}"
        await data_injestion(
            text_content=formatted_turn,
            collection_name="current_session",
            description="Current learning session conversation history"
        )
        return "Successfully logged conversation turn to 'current_session'."
    except Exception as e:
        return f"Error logging conversation turn: {str(e)}"

@agent.tool
async def calculateExpression(ctx: RunContext[SupportDependencies], expression: str) -> str:
    '''safely evaluate a mathematical expression or use it to answer calculation queries'''
    try:
        allowed_names = {'abs': abs, 'round': round, 'min': min, 'max': max, 'sum': sum, 'pow': pow}
        result = eval(expression, {"__builtins__": {}}, allowed_names)
        return f"Result: {result}"
    except Exception as e:
        return f"Error calculating expression: {str(e)}"

async def get_memory_snippet(query_context: str = "", n_results: int = 10) -> str:
    """
    Retrieves relevant context from chat histrory stored in 'current_session' embedding.
    Always use it if you need past conversation context. or think  user is asking something related to past conversation.
    Returns empty string if nothing is found.
    """
    memory = await SupportDependencies.getConversationSummary(query=query_context, n_results=n_results)
    if "No relevant" in memory or "Error" in memory:
        return ""
    return f"Relevant past conversation:\n{memory}\n"

## Prompts ##
async def get_base_context() -> str:
    """
    Build the base agent context dynamically with awaited embeddings info.
    """
    embeddings_info = await SupportDependencies.getPresentEmbeddingsInfo()
    return f"""
You are an intelligent educational assistant with access to a conversation long term memory usinng Retrieval-Augmented Generation (RAG) system.
You can retrieve and reason over the following embedding ''current_session'' which contains the conversation history of the current learning session.
{embeddings_info}

if its related give summarized context in your answer.
Tasks:
1. Analyze and try to find the summary of previous conversation.
2. draft its summary in your answer.
3. Identify key points and form a well detailed answer.

Query is --> \n\n
"""

async def rag_query_prompt(query_context: str = ""):
    memory = await get_memory_snippet(query_context)
    return f"""{await get_base_context()}
{memory}
Retrieve and answer any factual or conceptual question:
- Then, use the `queryAllEmbeddings` tool to find relevant info from all other embeddings.
- If no relevant info is found in embeddings, use `searchWebTool`.
- Cite the relevant embedding collection in your answer.
{query_context}
"""

async def talk_prompt(query_context: str = ""):
    memory = await get_memory_snippet(query_context)
    return f"""{await get_base_context()}
{memory}
Engage in natural conversation while leveraging available knowledge:
- Use conversational, friendly tone
- Reference available embeddings when relevant using `queryAllEmbeddings`
- Use `searchWebTool` for general knowledge if needed only if query involves current events or very recent info
- Keep responses concise and engaging
{query_context}
"""

async def summarize_conversation_prompt(conversation_history: str = "", query_context: str = "", new_message: str = ''):
    return f"""You are a conversation summarizer that extracts and stores key information efficiently.

## YOUR TASK
Create a concise summary (under 100 words, max 200) capturing:
- Main topics discussed
- Key decisions made
- Action items or commitments
- Important context for future reference

## MANDATORY WORKFLOW
Follow these steps IN ORDER:

1. RETRIEVE CONTEXT
   - Call queryAllEmbeddings(collection="current_session") to get existing conversation context
   - This helps avoid duplicate information and builds on previous summaries

2. ANALYZE ALL INFORMATION
   - Review the retrieved embeddings
   - Examine the conversation history below
   - Consider the new message and query context
   - Identify what's NEW or IMPORTANT that isn't already captured

3. CREATE SUMMARY

   - If conversation_history exists, create a focused summary of key points
   - Be specific: include names, dates, decisions, and commitments
   - Avoid generic statements

4. STORE SUMMARY
   - Call logConversation(summary_text, collection="current_session")
   - This persists the summary for future retrieval

## INPUT DATA

### Conversation History:
{conversation_history if conversation_history else "[Empty - Log current exchange only]"}

### New AI Message:
{new_message if new_message else "[No new message]"}

### User Query Context:
{query_context if query_context else "[No query context]"}

## OUTPUT RULES
- **If no conversation_history**: Log "User: [query_context] | AI: [new_message]" directly
- **If conversation_history exists**: Provide bulleted summary of key points
- Always confirm after logging

Example with history:
- User requested feature X for project Y
- AI suggested approach Z with timeline of 2 weeks
- Decision: Will implement Z pending approval
[Summary logged to current_session]

Example without history:
User: How do I reset my password? | AI: You can reset your password by clicking the "Forgot Password" link on the login page.
[Exchange logged to current_session]
        ##Below is the conversation history and new message from ai agent and query from user.##
        {conversation_history}
        New Message: {new_message}
        {query_context}
"""

async def run_summarize_agent_task(
    query: str = "",
    new_message: str = "",
    agent: Agent = summarize_agent
):
    global SESSION_SUMMARY_HISTORY
    try:
        summary_result = await agent.run(
            await summarize_conversation_prompt(
                conversation_history=SESSION_SUMMARY_HISTORY,
                query_context=query,
                new_message=new_message
            ),
            deps=SupportDependencies,
            output_type=SummaryState,
        )
        print("Summary Agent Output:", summary_result)
        print(summary_result.output)
        
        # Fix:
        if hasattr(summary_result.output, 'summary'):
            SESSION_SUMMARY_HISTORY = summary_result.output.summary
        elif hasattr(summary_result.output, 'output'):
            SESSION_SUMMARY_HISTORY = summary_result.output.output
        else:
            # Fallback: convert to JSON string
            SESSION_SUMMARY_HISTORY = summary_result.output.model_dump_json()
        
        print("Session summary updated:", SESSION_SUMMARY_HISTORY)#
        
    except Exception as e:
        print(f"Error in summarize agent: {e}")
        import traceback
        traceback.print_exc()
        return 'Error summarizing conversation.'
## Unified Agent Run Function ##
async def run_agent_task(
    mode: Literal['rag','talk'],
    query: str = "",
    topic: str = "",
    agent: Agent = agent
):
    global SESSION_SUMMARY_HISTORY
    ## Run agent based on mode ##
    if mode == 'rag':
        result = await agent.run(
            await rag_query_prompt(query_context=SESSION_SUMMARY_HISTORY+query),
            deps=SupportDependencies,
            output_type=AgentState,
        )
    elif mode == 'talk':
        result = await agent.run(
            await talk_prompt(query_context=SESSION_SUMMARY_HISTORY+query),
            deps=SupportDependencies,
            output_type=AgentState,
        )
    else:
        raise ValueError(f"Invalid mode: {mode}") # This was the original issue's location

    # Update session summary history in background
    async def background_summarize():
        try:
            await run_summarize_agent_task(query=query, new_message=str(result.output))
        except Exception as e:
            print(f"ackground summarization failed: {e}")
            import traceback
            traceback.print_exc()
    
    asyncio.create_task(background_summarize())    
    
    print("Agent output:", result.output)
    return result.output.output or result.output.model_dump_json()
