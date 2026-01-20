// Manual mock for next/server to fix next-auth import issues
export class NextRequest {
  constructor(public url: string, public init?: RequestInit) {}
  json() {
    // Parse the body if it exists
    if (this.init?.body) {
      try {
        return Promise.resolve(JSON.parse(this.init.body as string))
      } catch (e) {
        return Promise.resolve({})
      }
    }
    return Promise.resolve({})
  }
}

export class NextResponse {
  static json(data: any, init?: { status?: number; headers?: HeadersInit }) {
    return {
      json: async () => data,
      status: init?.status || 200,
      headers: new Headers(init?.headers || {})
    }
  }
}

export const userAgent = () => ({ browser: { name: 'test' } })
export const userAgentFromString = () => ({ browser: { name: 'test' } })
