"""Verify current ChromaDB metadata state."""

from services.vector_store import initialize_collection

def check_metadata():
    """Check current metadata fields."""

    print("Checking ChromaDB metadata state...")
    print("-" * 60)

    collection = initialize_collection()

    # Get sample vectors
    results = collection.get(limit=5, include=["metadatas"])

    if not results or not results['ids']:
        print("No vectors found")
        return

    print(f"Total vectors: {collection.count()}\n")

    for idx, (vec_id, metadata) in enumerate(zip(results['ids'], results['metadatas'])):
        print(f"Vector {idx + 1}:")
        print(f"  ID: {vec_id}")
        print(f"  Metadata keys: {list(metadata.keys())}")
        print(f"  user_id: {metadata.get('user_id', 'MISSING')}")
        print(f"  document_id: {metadata.get('document_id', 'MISSING')}")
        print(f"  document_name: {metadata.get('document_name', 'MISSING')}")
        print(f"  document_filename: {metadata.get('document_filename', 'MISSING')}")
        print(f"  chunk_index: {metadata.get('chunk_index', 'MISSING')}")
        print()

if __name__ == "__main__":
    check_metadata()
