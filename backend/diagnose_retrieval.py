"""Diagnostic script to identify document retrieval issues."""

import asyncio
from sqlalchemy import select, func
from db.session import AsyncSessionLocal
from models.document import Document
from models.chunk import Chunk
from services.vector_store import initialize_collection, search_similar
from services.embedder import generate_embedding
import sys

async def diagnose():
    """Run comprehensive diagnostics on document retrieval system."""

    print("=" * 60)
    print("DOCUMENT RETRIEVAL DIAGNOSTIC")
    print("=" * 60)

    async with AsyncSessionLocal() as db:
        # 1. Check PostgreSQL documents
        print("\n1. Checking PostgreSQL Database...")
        print("-" * 60)

        doc_count_query = select(func.count(Document.id))
        doc_count_result = await db.execute(doc_count_query)
        doc_count = doc_count_result.scalar()
        print(f"   Total documents in database: {doc_count}")

        if doc_count > 0:
            # Get sample documents
            doc_query = select(Document).limit(5)
            doc_result = await db.execute(doc_query)
            documents = doc_result.scalars().all()

            print(f"\n   Sample documents:")
            for doc in documents:
                print(f"   - ID: {doc.id}")
                print(f"     Name: {doc.filename}")
                print(f"     User ID: {doc.user_id}")
                print(f"     Status: {doc.status}")
                print(f"     Created: {doc.created_at}")
                print()

        # 2. Check document chunks
        print("\n2. Checking Document Chunks...")
        print("-" * 60)

        chunk_count_query = select(func.count(Chunk.id))
        chunk_count_result = await db.execute(chunk_count_query)
        chunk_count = chunk_count_result.scalar()
        print(f"   Total chunks in database: {chunk_count}")

        if chunk_count > 0:
            # Get sample chunks
            chunk_query = select(Chunk).limit(3)
            chunk_result = await db.execute(chunk_query)
            chunks = chunk_result.scalars().all()

            print(f"\n   Sample chunks:")
            for chunk in chunks:
                print(f"   - Chunk ID: {chunk.id}")
                print(f"     Document ID: {chunk.document_id}")
                print(f"     Index: {chunk.chunk_index}")
                try:
                    print(f"     Content preview: {chunk.text[:100]}...")
                except UnicodeEncodeError:
                    print(f"     Content preview: [Contains Unicode characters]")
                print()

    # 3. Check ChromaDB vector store
    print("\n3. Checking ChromaDB Vector Store...")
    print("-" * 60)

    try:
        collection = initialize_collection()
        collection_count = collection.count()
        print(f"   Collection name: {collection.name}")
        print(f"   Total vectors: {collection_count}")

        if collection_count > 0:
            print(f"\n   Sample metadata from first 3 vectors:")
            # Get all items to inspect metadata
            results = collection.get(limit=3, include=["metadatas", "documents"])

            for idx, (meta, doc) in enumerate(zip(results['metadatas'], results['documents'])):
                print(f"\n   Vector {idx + 1}:")
                print(f"   - Metadata keys: {list(meta.keys())}")
                print(f"   - user_id: {meta.get('user_id', 'MISSING')}")
                print(f"   - document_id: {meta.get('document_id', 'MISSING')}")
                print(f"   - document_name: {meta.get('document_name', 'MISSING')}")
                print(f"   - document_filename: {meta.get('document_filename', 'MISSING')}")
                print(f"   - chunk_index: {meta.get('chunk_index', 'MISSING')}")
                print(f"   - Content preview: {doc[:100]}...")
        else:
            print("\n   ⚠ WARNING: No vectors in ChromaDB!")
            print("   This means documents were not properly ingested.")

    except Exception as e:
        print(f"   ❌ ERROR accessing ChromaDB: {e}")

    # 4. Test actual retrieval
    print("\n4. Testing Document Retrieval...")
    print("-" * 60)

    if doc_count > 0 and chunk_count > 0 and collection_count > 0:
        async with AsyncSessionLocal() as db:
            # Get a user ID from existing documents
            doc_query = select(Document).limit(1)
            doc_result = await db.execute(doc_query)
            sample_doc = doc_result.scalar_one_or_none()

            if sample_doc:
                user_id = str(sample_doc.user_id)
                test_query = "What is in this document?"

                print(f"   Testing with user_id: {user_id}")
                print(f"   Test query: '{test_query}'")
                print()

                try:
                    # Generate embedding
                    query_embedding = await generate_embedding(test_query)
                    print(f"   ✓ Generated query embedding (dimension: {len(query_embedding)})")

                    # Search vector store
                    results = search_similar(
                        query_embedding=query_embedding,
                        user_id=user_id,
                        n_results=5
                    )

                    if results and results.get('ids') and results['ids'][0]:
                        num_results = len(results['ids'][0])
                        print(f"   ✓ Found {num_results} results from vector search")

                        print(f"\n   Search results:")
                        for idx, (chunk_id, distance, metadata) in enumerate(
                            zip(results['ids'][0], results['distances'][0], results['metadatas'][0])
                        ):
                            relevance_score = 1.0 / (1.0 + distance)
                            print(f"\n   Result {idx + 1}:")
                            print(f"   - Chunk ID: {chunk_id}")
                            print(f"   - Distance: {distance:.4f}")
                            print(f"   - Relevance Score: {relevance_score:.4f}")
                            print(f"   - Document Name: {metadata.get('document_name', metadata.get('document_filename', 'MISSING'))}")
                            print(f"   - User ID matches: {metadata.get('user_id') == user_id}")
                    else:
                        print(f"   ❌ No results returned from vector search!")
                        print(f"   This indicates a user isolation or embedding issue.")

                except Exception as e:
                    print(f"   ❌ Retrieval test failed: {e}")
                    import traceback
                    traceback.print_exc()
    else:
        print("   ⚠ Skipping retrieval test - no data available")

    # 5. Summary and recommendations
    print("\n" + "=" * 60)
    print("SUMMARY & RECOMMENDATIONS")
    print("=" * 60)

    if doc_count == 0:
        print("❌ PROBLEM: No documents in PostgreSQL database")
        print("   → Upload documents through the UI")
    elif chunk_count == 0:
        print("❌ PROBLEM: Documents exist but no chunks created")
        print("   → Check document ingestion logs for errors")
    elif collection_count == 0:
        print("❌ PROBLEM: Chunks exist but no vectors in ChromaDB")
        print("   → Vector storage failed during ingestion")
        print("   → Check backend logs for ChromaDB errors")
    else:
        print("✓ Data exists in all stores")
        print()
        print("If retrieval still fails, check:")
        print("   1. Intent classification (should_retrieve_documents)")
        print("   2. Similarity threshold (currently 60%)")
        print("   3. User ID matching in queries")
        print("   4. Metadata field names (document_name vs document_filename)")

if __name__ == "__main__":
    asyncio.run(diagnose())
