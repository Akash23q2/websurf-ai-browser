## DEPENDENCY MANAGEMENT ##
import importlib
import subprocess
import sys
import requests
import os
import re
import unicodedata

dependencies = [
    'langchain',
    'langchain-text-splitters',
    'langchain-community',
    'chromadb',
    'sentence-transformers',
    'pdfplumber'
]

def install_if_missing(package_name):
    try:
        importlib.import_module(package_name.replace("-", "_"))
        print(f" {package_name} is already installed.")
    except ImportError:
        print(f"⬇ Installing {package_name}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", package_name])

if not True: #set to True to for installation
    for dep in dependencies:install_if_missing(dep)

print("\nAll dependencies are ready to use!")


##Imports ##
from langchain_text_splitters import RecursiveCharacterTextSplitter
import chromadb
from sentence_transformers import SentenceTransformer
import pdfplumber as pdf_tool


## RAG PIPELINE ##
class RagPipeline:
    def __init__(self):
        self.chunks=None
        self.embeddings=None
        self.pages=1 #bydefault
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        self.client=chromadb.Client()
        
    def chunks_from_pdf(self,pdf_path:str,chunk_overlap:int=50):
        #make chunks from pdf file
        pages=[]
        with pdf_tool.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(self._clean_text(text))
        pdf_content = "\n".join(pages)
        self.pages=len(pages)
        self.chunks=self._make_chunks(text_content=pdf_content,
                     chunk_size=500,chunk_overlap=chunk_overlap)
        
    def chunks_from_url(self,pdf_url:str,chunk_overlap:int=50):
        #make chunks from the pdf url
        local_path = "temp.pdf"
        response = requests.get(pdf_url)
        with open(local_path, "wb") as f:
            f.write(response.content)
        self.chunks_from_pdf(local_path)
        # Check if file exists before deleting
        if os.path.exists(local_path):
            os.remove(local_path)

    def chunks_from_text(self,text_content:str,return_chunk:bool=False,chunk_overlap:int=50):
        #make chunks from text
        if return_chunk:
            return self._make_chunks(text_content=text_content)
        self.chunks=self._make_chunks(text_content=text_content,chunk_overlap=chunk_overlap)
        
    def _clean_text(self,text):
        # Remove duplicate characters
        text = re.sub(r'([A-Za-z])\1', r'\1', text)
       # Normalize unicode
        text = unicodedata.normalize("NFKD", text)
       # Remove excessive whitespace and weird spacing
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def _make_chunks(self,text_content:str,chunk_size:int=500,
                     chunk_overlap:int=50):
        splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ".", " ", ""]
        )
        return splitter.split_text(text_content) #returns the chunks
        
    def make_embeddings(self,batch_size:int=32,chunks:list=None,
                        embedding_model:str=None):
        # Load embedding model if specified, otherwise keep default
        if embedding_model:
            self.embedder = SentenceTransformer(embedding_model)
        #prepare the embeddings from the chunk
        self.embeddings=[]
        #check is chunks provided
        if chunks:self.chunks=chunks    
        for i in range(0, len(self.chunks), batch_size):
            batch = self.chunks[i:i+batch_size]
            batch_embeddings = self.embedder.encode(batch).tolist()
            self.embeddings.extend(batch_embeddings)
        
    def save_embeddings(self, collection_name: str = 'default_collection', embeddings: list[list] = None,
                        db_path: str = None, append: bool = True):
        # Initialize Chroma client
        self.client = chromadb.PersistentClient(path=db_path) if db_path else chromadb.Client()
        
        if embeddings:
            self.embeddings = embeddings

        # Get or create collection
        collection = self.client.get_or_create_collection(name=collection_name)

        # Generate unique IDs for new documents
        existing_count = collection.count() if append else 0
        document_ids = [str(existing_count + i) for i in range(len(self.chunks))]

        # Rough page mapping
        metadatas = [{"page": i // max(1, len(self.chunks)//self.pages)} for i in range(len(self.chunks))]

        # Add or replace embeddings
        if append:
            collection.add(
                ids=document_ids,
                documents=self.chunks,
                embeddings=self.embeddings,
                metadatas=metadatas
            )
        else:
            # Overwrite the collection if append=False
            collection.delete()  # Clear existing docs
            collection.add(
                ids=document_ids,
                documents=self.chunks,
                embeddings=self.embeddings,
                metadatas=metadatas
            )
        
    def retrieve(self,collection_name,query:str,n_results:int=10):
        collection = self.client.get_or_create_collection(name=collection_name)
        query_emb=self.embedder.encode(self._make_chunks(query)).tolist()
        results = collection.query(query_embeddings=query_emb,n_results=n_results)['documents'][0]
        # print(results,'\n'*5)
        # for i, (docs_for_query, metas_for_query) in enumerate(zip(results['documents'], results['metadatas'])):
        #     print(f"Results for query {i+1}:")
        # for doc, meta in zip(docs_for_query, metas_for_query):
        #     print(doc[:50], meta)
        #     print("-"*30)
        return results 
        
    def delete_data(self,collection_name:str,db_path=None):
        if db_path:
            self.client = chromadb.PersistentClient(path=db_path)
        self.client.delete_collection(name=collection_name)