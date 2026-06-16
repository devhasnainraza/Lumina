"""Fix metadata field name in ChromaDB vectors."""

from services.vector_store import initialize_collection

def fix_metadata():
    """Update document_filename to document_name in all vectors."""

    print("Fixing ChromaDB metadata...")
    print("-" * 60)

    collection = initialize_collection()

    # Get all vectors
    results = collection.get(include=["metadatas"])

    if not results or not results['ids']:
        print("No vectors found in ChromaDB")
        return

    total = len(results['ids'])
    print(f"Found {total} vectors to update")

    updated = 0
    for vector_id, metadata in zip(results['ids'], results['metadatas']):
        # Check if this vector has the old field name
        if 'document_filename' in metadata and 'document_name' not in metadata:
            # Create updated metadata
            new_metadata = metadata.copy()
            new_metadata['document_name'] = metadata['document_filename']
            # Keep the old field for backwards compatibility

            # Update the vector
            collection.update(
                ids=[vector_id],
                metadatas=[new_metadata]
            )
            updated += 1

    print(f"Updated {updated} vectors")
    print(f"Metadata fix complete!")

    # Verify the fix
    print("\nVerifying fix...")
    sample = collection.get(limit=3, include=["metadatas"])
    for idx, meta in enumerate(sample['metadatas']):
        doc_name = meta.get('document_name', 'MISSING')
        print(f"  Sample {idx+1}: document_name = {doc_name}")

if __name__ == "__main__":
    fix_metadata()
