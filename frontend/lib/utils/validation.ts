import { FILE_UPLOAD_CONSTRAINTS } from '@/types/document';

/**
 * Validate file for upload
 */
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

  // Check file extension
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

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  if (password.length > 128) {
    return {
      valid: false,
      error: 'Password must be less than 128 characters',
    };
  }

  return { valid: true };
}
