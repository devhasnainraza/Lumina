/**
 * Document file type
 */
export type FileType = 'pdf' | 'docx' | 'txt';

/**
 * Document processing status
 */
export type DocumentStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

/**
 * Uploaded document metadata
 */
export interface Document {
  id: string;
  filename: string;
  fileSize: number;
  fileType: FileType;
  status: DocumentStatus;
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
}

/**
 * Document with chunk count (detailed view)
 */
export interface DocumentDetail extends Document {
  chunkCount: number;
}

/**
 * Text chunk of a document
 */
export interface Chunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  text: string;
  tokenCount: number;
  createdAt: string;
}


/**
 * Document list response with pagination
 */
export interface DocumentListResponse {
  documents: Document[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Upload progress tracking
 */
export interface UploadProgress {
  filename: string;
  fileSize: number;
  bytesUploaded: number;
  percentage: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'failed';
  error?: string;
}

/**
 * Usage statistics summary
 */
export interface UsageStats {
  queryCount: number;
  documentCount: number;
  sessionCount: number;
  tokenUsage?: number;
}

/**
 * Activity data point for charts
 */
export interface ActivityDataPoint {
  date: string;
  count: number;
}

/**
 * Document type breakdown
 */
export interface DocumentTypeStats {
  pdf: number;
  docx: number;
  txt: number;
}

/**
 * Analytics dashboard data
 */
export interface AnalyticsDashboard {
  stats: UsageStats;
  activityTimeline: ActivityDataPoint[];
  documentTypes: DocumentTypeStats;
  storageUsed: number;
  storageLimit?: number;
}

/**
 * File upload constraints
 */
export const FILE_UPLOAD_CONSTRAINTS = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ] as const,
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.txt'] as const,
} as const;
