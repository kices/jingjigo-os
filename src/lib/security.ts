/**
 * Security Utilities for Mission Control
 * Provides input validation, sanitization, and security helpers
 */

import { NextRequest } from 'next/server';

/**
 * Get client IP from request (handles proxies)
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Validate and sanitize file path
 * Prevents path traversal attacks
 */
export function sanitizePath(filePath: string): { valid: boolean; path?: string; error?: string } {
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: 'Invalid path' };
  }

  // Check for path traversal
  if (filePath.includes('..') || filePath.startsWith('/') || filePath.includes('\\')) {
    return { valid: false, error: 'Path traversal detected' };
  }

  // Check for null bytes
  if (filePath.includes('\0')) {
    return { valid: false, error: 'Invalid characters in path' };
  }

  // Normalize and return
  const sanitized = filePath.replace(/[^a-zA-Z0-9._\-/]/g, '_');
  return { valid: true, path: sanitized };
}

/**
 * Validate file extension against whitelist
 */
export function validateFileExtension(filename: string, allowed: Set<string>): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return allowed.has('.' + ext);
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Truncate
  const truncated = input.slice(0, maxLength);
  
  // Remove potentially dangerous characters
  return truncated
    .replace(/<script/gi, '&lt;script')
    .replace(/<\/script>/gi, '&lt;/script&gt;')
    .replace(/javascript:/gi, 'javascript:')
    .replace(/on\w+=/gi, '');
}

/**
 * Validate JSON structure
 */
export function validateJson(data: any, requiredFields: string[]): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid JSON' };
  }

  for (const field of requiredFields) {
    if (!(field in data)) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  return { valid: true };
}

/**
 * Rate limiter helper (for use in API routes)
 */
export class RateLimiter {
  private attempts = new Map<string, { count: number; windowStart: number; lockedUntil?: number }>();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000,
    private lockoutMs: number = 15 * 60 * 1000
  ) {}

  checkLimit(key: string): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      return { allowed: true };
    }

    if (record.lockedUntil && now < record.lockedUntil) {
      return { allowed: false, retryAfterMs: record.lockedUntil - now };
    }

    if (now - record.windowStart > this.windowMs) {
      this.attempts.delete(key);
      return { allowed: true };
    }

    if (record.count >= this.maxAttempts) {
      record.lockedUntil = now + this.lockoutMs;
      this.attempts.set(key, record);
      return { allowed: false, retryAfterMs: this.lockoutMs };
    }

    return { allowed: true };
  }

  recordAttempt(key: string): void {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record || now - record.windowStart > this.windowMs) {
      this.attempts.set(key, { count: 1, windowStart: now });
    } else {
      record.count += 1;
      this.attempts.set(key, record);
    }
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

// Export shared rate limiter instance
export const apiRateLimiter = new RateLimiter();
