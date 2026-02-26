import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { logActivity } from '@/lib/activities-db';

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || '/root/.openclaw';

const WORKSPACE_MAP: Record<string, string> = {
  workspace: path.join(OPENCLAW_DIR, 'workspace'),
  'mission-control': path.join(OPENCLAW_DIR, 'workspace', 'mission-control'),
};

// Allowed file extensions (security: prevent executable uploads)
const ALLOWED_EXTENSIONS = new Set([
  '.txt', '.md', '.json', '.ts', '.tsx', '.js', '.jsx',
  '.css', '.scss', '.html', '.xml', '.yaml', '.yml',
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.log', '.csv', '.sql', '.sh', '.bash', '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp'
]);

// Max file size: 10MB (security: prevent DoS)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function resolvePath(workspace: string, filePath: string): string | null {
  const base = WORKSPACE_MAP[workspace];
  if (!base) return null;
  const full = path.resolve(base, filePath);
  if (!full.startsWith(base)) return null; // path traversal check
  return full;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const workspace = (formData.get('workspace') as string) || 'workspace';
    const dirPath = (formData.get('path') as string) || '';
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const base = WORKSPACE_MAP[workspace];
    if (!base) {
      return NextResponse.json({ error: 'Unknown workspace' }, { status: 400 });
    }

    const results: Array<{ name: string; size: number; path: string }> = [];
    const errors: Array<{ name: string; error: string }> = [];

    for (const file of files) {
      const sanitizedName = path.basename(file.name);
      
      // Security: Check file extension
      const ext = path.extname(sanitizedName).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        errors.push({ name: sanitizedName, error: `File type '${ext}' not allowed` });
        continue;
      }

      // Security: Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push({ name: sanitizedName, error: `File too large (max 10MB)` });
        continue;
      }

      const targetDir = path.resolve(base, dirPath);
      if (!targetDir.startsWith(base)) {
        errors.push({ name: sanitizedName, error: 'Invalid path' });
        continue;
      }

      await fs.mkdir(targetDir, { recursive: true });
      const targetPath = path.join(targetDir, sanitizedName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(targetPath, buffer);

      results.push({
        name: sanitizedName,
        size: buffer.length,
        path: dirPath ? `${dirPath}/${sanitizedName}` : sanitizedName,
      });
    }

    logActivity('file_write', `Uploaded ${results.length} file(s) to ${workspace}/${dirPath || '/'}`, 'success', {
      metadata: { files: results.map((r) => r.name), workspace, dirPath, errors: errors.length },
    });

    return NextResponse.json({ 
      success: true, 
      files: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('[upload] Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
