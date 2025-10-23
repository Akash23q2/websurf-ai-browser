## imports ##
from app.services.rag_pipeline import RagPipeline
import re
import unicodedata
import chromadb

rag_model=RagPipeline()
global avilable_collections
avilable_collections = {} #dictionary of collection name to description

## methods ##
async def data_injestion(pdf_path: str = None, pdf_url: str = None, text_content: str = None,
                   collection_name: str = "default_collection", description: str = "",
                   chunks=None, chunksize: int = 500, chunk_overlap: int = 50, batch_size: int = 32,
                   embedding_model: str = None, db_path: str = None, append: bool = True):
    global avilable_collections

    # Register collection info
    if collection_name not in avilable_collections:
        avilable_collections[collection_name] = description
        print(f" New collection registered: {collection_name}")
    else:
        if append:
            print(f"Appending data to existing collection: {collection_name}")
        else:
            print(f" Overwriting existing collection: {collection_name}")

    print("🔍 Current collections:", avilable_collections)
    # Create new instance each ingestion (to reset internal state)
    rag_model = RagPipeline()
    # Handle ingestion source
    if pdf_path:
        rag_model.chunks_from_pdf(pdf_path, chunk_overlap=chunk_overlap)
    elif pdf_url:
        rag_model.chunks_from_url(pdf_url, chunk_overlap=chunk_overlap)
    elif text_content:
        rag_model.chunks_from_text(text_content, chunk_overlap=chunk_overlap)
    elif chunks:
        rag_model.chunks = chunks
    else:
        raise ValueError("Please provide either pdf_path, pdf_url, or text_content.")
    # Generate embeddings and save
    rag_model.make_embeddings(embedding_model=embedding_model, batch_size=batch_size)
    rag_model.save_embeddings(collection_name=collection_name, db_path=db_path, append=append)
    print(f"Data Ingestion complete: {len(rag_model.chunks)} chunks saved to '{collection_name}'.")

async def query_engine(query,collection_name="default_collection",pretty_print=True,
                 n_results=5,db_path=None):
    rag_model.chunks_from_text(text_content=query)
    rag_model.make_embeddings()
    rag_model.client = chromadb.PersistentClient(path=db_path) if db_path else chromadb.Client()
    collection = rag_model.client.get_collection(name=collection_name)
    results = collection.query(query_embeddings=rag_model.embeddings,n_results=n_results)
    return await _clean_documents_result(results) if pretty_print else results

async def clean_text_response(text: str) -> str:
    if not text or not isinstance(text, str):
        return ""
    text = unicodedata.normalize("NFKC", text)
    text = re.sub(r'([,;:.!?])\1+', r'\1', text)
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'•{2,}', '•', text)
    text = re.sub(r'\b(\w+)( \1\b)+', r'\1', text, flags=re.IGNORECASE)
    text = re.sub(r'([<>=])\1+', r'\1', text)
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r',,', ',', text)
    text = text.strip()
    return text

async def _clean_documents_result(result_dict: dict) -> list[str]:
    docs = []
    if "documents" in result_dict and result_dict["documents"]:
        for doc_list in result_dict["documents"]:
            for doc in doc_list:
                cleaned = await clean_text_response(doc)
                if cleaned:
                    docs.append(cleaned)
    return docs

    
async def delete_data(rag_model,collection_name,db_path):
        rag_model.delete_data(collection_name=collection_name,db_path=db_path)