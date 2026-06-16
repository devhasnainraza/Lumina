"""Test actual document retrieval with a real query."""

import asyncio
from services.embedder import generate_embedding
from services.vector_store import search_similar
from services.intent_classifier import should_retrieve_documents, classify_query_intent

async def test_retrieval():
    """Test the complete retrieval pipeline."""

    print("Testing Document Retrieval Pipeline")
    print("=" * 60)

    # Use a user ID from the documents we found
    user_id = "28786d6e-94a1-4a49-8a86-53c17dee1bc7"

    # Test queries
    test_queries = [
        "What's in my document?",
        "Summarize the uploaded file",
        "Tell me about AI agents",
        "What is agentic AI?",
        "Hello"
    ]

    for query in test_queries:
        print(f"\n{'='*60}")
        print(f"Query: '{query}'")
        print("-" * 60)

        # Step 1: Intent classification
        intent = classify_query_intent(query)
        should_retrieve = should_retrieve_documents(query)
        print(f"Intent: {intent}")
        print(f"Should retrieve documents: {should_retrieve}")

        if not should_retrieve:
            print("SKIPPED - Intent classifier says no retrieval needed")
            continue

        # Step 2: Generate embedding
        try:
            query_embedding = await generate_embedding(query)
            print(f"Generated embedding: dimension {len(query_embedding)}")
        except Exception as e:
            print(f"ERROR generating embedding: {e}")
            continue

        # Step 3: Search vector store
        try:
            results = search_similar(
                query_embedding=query_embedding,
                user_id=user_id,
                n_results=5
            )

            if results and results.get('ids') and results['ids'][0]:
                num_results = len(results['ids'][0])
                print(f"Found {num_results} results from ChromaDB")

                # Show top 3 results
                for idx in range(min(3, num_results)):
                    distance = results['distances'][0][idx]
                    relevance = 1.0 / (1.0 + distance)
                    metadata = results['metadatas'][0][idx]
                    doc_name = metadata.get('document_name', 'Unknown')

                    print(f"\n  Result {idx + 1}:")
                    print(f"    Relevance: {relevance:.4f} ({relevance*100:.1f}%)")
                    print(f"    Document: {doc_name}")
                    print(f"    Chunk: {metadata.get('chunk_index', '?')}")
                    print(f"    Passes 60% threshold: {'YES' if relevance >= 0.60 else 'NO'}")
            else:
                print("NO RESULTS from ChromaDB")
                print("This indicates a user isolation or search issue")

        except Exception as e:
            print(f"ERROR during search: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 60)
    print("Test complete!")

if __name__ == "__main__":
    asyncio.run(test_retrieval())
