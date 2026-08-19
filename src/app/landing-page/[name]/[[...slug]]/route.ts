import { readFile, stat } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
}

const LANDING_NAME_ALIASES: Record<string, string> = {
  'are-u-okay-cupcakes': 'area-cupcakes',
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

function safeSegment(value: string): string | null {
  if (!value || value.includes('..') || value.includes('\\') || value.includes('/')) {
    return null
  }
  return value
}

async function serveLandingPage(
  _req: NextRequest,
  context: { params: Promise<{ name: string; slug?: string[] }> }
) {
  const { name, slug } = await context.params
  const safeName = safeSegment(name)
  if (!safeName) {
    return NextResponse.json({ success: false, message: 'Invalid landing page name' }, { status: 400 })
  }

  const landingDir = LANDING_NAME_ALIASES[safeName] || safeName
  const baseDir = path.join(process.cwd(), 'standalone-landing', landingDir)
  const requestedParts = (slug || []).map((part) => safeSegment(part))

  if (requestedParts.some((part) => part === null)) {
    return NextResponse.json({ success: false, message: 'Invalid file path' }, { status: 400 })
  }

  const relativePath = requestedParts.length > 0 ? requestedParts.join(path.sep) : 'index.html'
  const resolvedPath = path.resolve(baseDir, relativePath)
  const normalizedBase = path.resolve(baseDir) + path.sep

  if (resolvedPath !== path.resolve(baseDir, 'index.html') && !resolvedPath.startsWith(normalizedBase)) {
    return NextResponse.json({ success: false, message: 'Forbidden path' }, { status: 403 })
  }

  try {
    const fileStat = await stat(resolvedPath)
    if (!fileStat.isFile()) {
      return NextResponse.json({ success: false, message: 'File not found' }, { status: 404 })
    }

    const data = await readFile(resolvedPath)
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': getMimeType(resolvedPath),
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch {
    return NextResponse.json({ success: false, message: 'Landing page not found' }, { status: 404 })
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ name: string; slug?: string[] }> }
) {
  return serveLandingPage(req, context)
}
