##imports
from fastapi import APIRouter, HTTPException, Form, UploadFile, File
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging
from app.services.rag_pipeline import RagPipeline
from app.services.rag_service import data_injestion,query_engine,delete_data,avilable_collections
import os
from app.schemas.response_schema import AddDocumentResponse, SearchRequest, SearchResponse, Document
 ##reset the present embeddings info

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

rag_router = APIRouter(tags=["RAG Routes"])

## API Endpoints 

@rag_router.post("/api/rag/add", status_code=201)
async def add_document(
    collection_name: str = Form("learning_notes"),
    description:str=Form('describe content'),
    text: Optional[str] = Form(None, description="Raw text to embed."),
    pdf_url: Optional[str] = Form(None, description="PDF URL to embed."),
    file: Optional[UploadFile] = File(None, description="Upload a file to embed.")
):
    """
    Add a document to a RAG collection.
    Only one of `text`, `pdf_url`, or `file` should be provided.
    """
    sources = [text, pdf_url, file and file.filename]
    if sum(bool(s) for s in sources) != 1:
        raise HTTPException(
            status_code=400,
            detail="Please provide exactly one of 'text', 'pdf_url', or 'file'."
        )

    try:
        if text:
            logger.info(f"Adding text document to collection: {collection_name}")
            await data_injestion(text_content=text, collection_name=collection_name,description=description)
        elif pdf_url:
            logger.info(f"Adding PDF URL to collection: {collection_name}")
            await data_injestion(pdf_url=pdf_url, collection_name=collection_name,description=description)
        elif file:
            logger.info(f"Adding file '{file.filename}' to collection: {collection_name}")
            await file.seek(0)
            await data_injestion(pdf_path=file.file, collection_name=collection_name,description=description)

        return {"message": "Document added and embedded successfully."}

    except Exception as e:
        logger.error(f"Failed to add document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        logger.error(f"Failed to add document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@rag_router.post("/api/rag/search", response_model=SearchResponse)
async def search_documents(request: SearchRequest):
    """
    Search for documents in a collection using a query.
    """
    try:
        logger.info(f"Searching '{request.collection_name}' for: '{request.query}'")
        search_results = await query_engine(
            query=request.query,
            collection_name=request.collection_name,
            n_results=request.k
        )

        # Convert each result into a Document
        results = []
        for doc in search_results:
            # If your search result includes metadata, unpack it
            if isinstance(doc, dict):
                results.append(Document(page_content=doc.get("page_content", ""), metadata=doc.get("metadata", {})))
            else:  # if it's just a string
                results.append(Document(page_content=doc, metadata={}))

        return SearchResponse(query=request.query, results=results)

    except Exception as e:
        logger.error(f"Search error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@rag_router.post("/api/rag/remove_collection/{collection_name}")
async def remove_collection(collection_name: str):
    """
    Remove a collection.
    """
    try:
        if not collection_name:
            raise HTTPException(status_code=400, detail="Collection name must be provided.")
        logger.info(f"Removing collection: {collection_name}")
        ##for now we are deleting entire rag_history along with it uncomment below if you want selective
        for collection_name in avilable_collections.keys():
            await delete_data(collection_name=collection_name)
        
        avilable_collections = {}

        # await delete_data(collection_name=collection_name)
        return {"message": f"Collection '{collection_name}' removed successfully."}
    except Exception as e:
        logger.error(f"Failed to remove collection: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))