# Documents API Contract

**Base URL**: `${NEXT_PUBLIC_API_URL}/api/docs`  
**Version**: 1.0  
**Authentication**: Required (JWT Bearer token)

---

## POST /api/docs/upload

Upload a document for processing.

### Request

**Headers**:
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body** (FormData):
```typescript
{
  file: File;            // PDF, DOCX, or TXT file (max 10MB)
}
```

**Example** (JavaScript):
```typescript
const formData = new FormData();
formData.append('file', fileObject);

const response = await apiClient.post('/api/docs/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (progressEvent) => {
    const percentage = (progressEvent.loaded / progressEvent.total) * 100;
    console.log(`Upload progress: ${percentage}%`);
  },
});
```

### Response

**Success (202 Accepted)**:
```typescript
{
  id: string;            // UUID
  filename: string;
  fileSize: number;      // Bytes
  fileType: "pdf" | "docx" | "txt";
  status: "uploaded";
  createdAt: string;     // ISO 8601
  message: string;       // "Document uploaded successfully. Processing has started."
}
```

**Example**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "filename": "research-paper.pdf",
  "fileSize": 2048576,
  "fileType": "pdf",
  "status": "uploaded",
  "createdAt": "2026-05-12T14:40:00Z",
  "message": "Document uploaded successfully. Processing has started."
}
```

**Errors**:
- `400 Bad Request`: Invalid file type or missing file
- `413 Payload Too Large`: File exceeds 10MB limit
- `401 Unauthorized`: Missing or invalid token

---

## GET /api/docs

List user's uploaded documents with pagination.

### Request

**Headers**:
```
Authorization: Bearer {token}
```

**Query Parameters**:
```typescript
{
  limit?: number;        // Page size (default 20, max 100)
  offset?: number;       // Skip count (default 0)
  status?: "uploaded" | "processing" | "completed" | "failed";  // Optional filter
}
```

**Example**:
```
GET /api/docs?limit=20&offset=0&status=completed
```

### Response

**Success (200 OK)**:
```typescript
{
  documents: Array<{
    id: string;
    filename: string;
    fileSize: number;
    fileType: "pdf" | "docx" | "txt";
    status: "uploaded" | "processing" | "completed" | "failed";
    createdAt: string;
    processedAt?: string;  // Present when status is "completed"
  }>;
  total: number;
  limit: number;
  offset: number;
}
```

**Example**:
```json
{
  "documents": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "filename": "research-paper.pdf",
      "fileSize": 2048576,
      "fileType": "pdf",
      "status": "completed",
      "createdAt": "2026-05-12T14:40:00Z",
      "processedAt": "2026-05-12T14:40:15Z"
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

## GET /api/docs/{documentId}

Get detailed information about a specific document.

### Request

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
- `documentId`: UUID of the document

**Example**:
```
GET /api/docs/770e8400-e29b-41d4-a716-446655440002
```

### Response

**Success (200 OK)**:
```typescript
{
  id: string;
  filename: string;
  fileSize: number;
  fileType: "pdf" | "docx" | "txt";
  status: "uploaded" | "processing" | "completed" | "failed";
  createdAt: string;
  processedAt?: string;
  chunkCount: number;      // Number of chunks created
  errorMessage?: string;   // Present if status is "failed"
}
```

**Example**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "filename": "research-paper.pdf",
  "fileSize": 2048576,
  "fileType": "pdf",
  "status": "completed",
  "createdAt": "2026-05-12T14:40:00Z",
  "processedAt": "2026-05-12T14:40:15Z",
  "chunkCount": 42
}
```

**Errors**:
- `404 Not Found`: Document not found or doesn't belong to user

---

## DELETE /api/docs/{documentId}

Delete a document and all associated data (chunks, embeddings).

### Request

**Headers**:
```
Authorization: Bearer {token}
```

**Path Parameters**:
- `documentId`: UUID of the document

**Example**:
```
DELETE /api/docs/770e8400-e29b-41d4-a716-446655440002
```

### Response

**Success (200 OK)**:
```typescript
{
  message: string;
  deleted: {
    documentId: string;
    chunksDeleted: number;
    embeddingsDeleted: number;
  }
}
```

**Example**:
```json
{
  "message": "Document deleted successfully",
  "deleted": {
    "documentId": "770e8400-e29b-41d4-a716-446655440002",
    "chunksDeleted": 42,
    "embeddingsDeleted": 42
  }
}
```

**Errors**:
- `404 Not Found`: Document not found or doesn't belong to user

---

## Frontend Integration

### File Upload with Progress

```typescript
// hooks/useUpload.ts
export function useUpload() {
  const uploadStore = useUploadStore();
  const queryClient = useQueryClient();

  const uploadFile = async (file: File) => {
    // Validate file
    if (file.size > FILE_UPLOAD_CONSTRAINTS.MAX_SIZE_BYTES) {
      throw new Error(`File size exceeds ${FILE_UPLOAD_CONSTRAINTS.MAX_SIZE_MB}MB limit`);
    }

    const allowedTypes = FILE_UPLOAD_CONSTRAINTS.ALLOWED_TYPES;
    if (!allowedTypes.includes(file.type as any)) {
      throw new Error('Invalid file type. Only PDF, DOCX, and TXT files are supported.');
    }

    // Add to upload store
    uploadStore.addUpload(file.name, file.size);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post('/api/docs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            uploadStore.updateProgress(file.name, progressEvent.loaded);
          }
        },
      });

      uploadStore.setStatus(file.name, 'processing');
      
      // Invalidate documents list
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      
      return response.data;
    } catch (error) {
      uploadStore.setStatus(file.name, 'failed');
      uploadStore.setError(file.name, error.message);
      throw error;
    }
  };

  return { uploadFile };
}
```

### Drag and Drop Component

```typescript
// components/upload/DropZone.tsx
export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const { uploadFile } = useUpload();

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    
    for (const file of files) {
      try {
        await uploadFile(file);
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  }, [uploadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragging ? 'border-primary bg-primary/10' : 'border-muted'
      )}
    >
      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
      <p className="mt-2 text-sm text-muted-foreground">
        Drag and drop files here, or click to browse
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        PDF, DOCX, TXT (max 10MB)
      </p>
    </div>
  );
}
```

### Document List with React Query

```typescript
// hooks/useDocuments.ts
export function useDocuments(params?: { status?: DocumentStatus }) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: async () => {
      const response = await apiClient.get('/api/docs', { params });
      return response.data;
    },
    refetchInterval: (data) => {
      // Poll every 5 seconds if any documents are processing
      const hasProcessing = data?.documents.some(
        (doc) => doc.status === 'processing' || doc.status === 'uploaded'
      );
      return hasProcessing ? 5000 : false;
    },
  });
}

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: ['document', documentId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/docs/${documentId}`);
      return response.data;
    },
    enabled: !!documentId,
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await apiClient.delete(`/api/docs/${documentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
```

---

## File Validation

### Client-Side Validation

```typescript
// lib/utils/validation.ts
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > FILE_UPLOAD_CONSTRAINTS.MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds ${FILE_UPLOAD_CONSTRAINTS.MAX_SIZE_MB}MB limit`,
    };
  }

  // Check file type
  const allowedTypes = FILE_UPLOAD_CONSTRAINTS.ALLOWED_TYPES;
  if (!allowedTypes.includes(file.type as any)) {
    return {
      valid: false,
      error: 'Invalid file type. Only PDF, DOCX, and TXT files are supported.',
    };
  }

  // Check file extension (additional check)
  const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
  const allowedExtensions = FILE_UPLOAD_CONSTRAINTS.ALLOWED_EXTENSIONS;
  if (!allowedExtensions.includes(extension as any)) {
    return {
      valid: false,
      error: 'Invalid file extension.',
    };
  }

  return { valid: true };
}
```

---

## Processing Status Polling

### Automatic Polling Strategy

```typescript
// Poll every 5 seconds while documents are processing
// Stop polling when all documents are completed or failed

export function useDocumentPolling() {
  const { data: documents } = useDocuments();

  const hasProcessing = useMemo(() => {
    return documents?.documents.some(
      (doc) => doc.status === 'processing' || doc.status === 'uploaded'
    );
  }, [documents]);

  // React Query handles polling via refetchInterval
  // See useDocuments hook above

  return { hasProcessing };
}
```

---

## Error Handling

### Upload Errors

```typescript
// Common upload error scenarios
const handleUploadError = (error: any) => {
  if (axios.isAxiosError(error)) {
    switch (error.response?.status) {
      case 400:
        return 'Invalid file. Please check the file type and try again.';
      case 413:
        return 'File is too large. Maximum size is 10MB.';
      case 401:
        return 'Session expired. Please log in again.';
      default:
        return 'Upload failed. Please try again.';
    }
  }
  return 'Network error. Please check your connection.';
};
```
