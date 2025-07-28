import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// TextEncoder/TextDecoder ポリフィル（PostgreSQL接続で必要）
if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder as unknown as typeof global.TextEncoder;
  global.TextDecoder = TextDecoder as unknown as typeof global.TextDecoder;
}

// Request/Response ポリフィル（Next.js API routes のテストで必要）
if (!global.Request) {
  global.Request = class Request {
    private _url: string;
    method: string;
    headers: Headers;
    json: () => Promise<unknown>;

    constructor(input: string, init?: RequestInit) {
      this._url = input;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.json = jest.fn();
    }

    get url() {
      return this._url;
    }
  } as unknown as typeof Request;
}

if (!global.Response) {
  global.Response = class Response {
    status: number;
    statusText: string;
    headers: Headers;

    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers);
    }

    json() {
      return Promise.resolve({});
    }
  } as unknown as typeof Response;
}

if (!global.Headers) {
  global.Headers = class Headers {
    private headers = new Map<string, string>();

    constructor(init?: HeadersInit) {
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.headers.set(key.toLowerCase(), value));
        } else if (init instanceof Headers) {
          // Headers の場合の処理
        } else {
          Object.entries(init).forEach(([key, value]) => this.headers.set(key.toLowerCase(), value));
        }
      }
    }

    set(name: string, value: string) {
      this.headers.set(name.toLowerCase(), value);
    }

    get(name: string) {
      return this.headers.get(name.toLowerCase()) || null;
    }

    has(name: string) {
      return this.headers.has(name.toLowerCase());
    }

    delete(name: string) {
      this.headers.delete(name.toLowerCase());
    }
  } as unknown as typeof Headers;
}

// Next.js cookies() グローバルモック設定
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue({ value: 'mock-token' }),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

// jose ライブラリのモック設定（Edge Runtime対応）
jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock-jwt-token'),
  })),
  jwtVerify: jest.fn().mockImplementation((token: string) => {
    if (token === 'valid-token') {
      return Promise.resolve({
        payload: {
          userId: 'user-123',
          username: 'testuser',
          role: 1,
        },
      });
    }
    throw new Error('Invalid token');
  }),
}));

// fetch() グローバルモック設定
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// React 18のact()警告を抑制（テスト環境でのみ）
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: An update to %s inside a test was not wrapped in act(...)') ||
       args[0].includes('An update to TestComponent inside a test was not wrapped in act(...)'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
