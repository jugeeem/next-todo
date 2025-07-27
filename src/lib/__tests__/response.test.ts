/**
 * @fileoverview Response ヘルパーユニットテスト
 *
 * このファイルは、API レスポンスヘルパー関数の動作を検証するテストスイートです。
 * 成功レスポンス、エラーレスポンス、HTTPステータスコードの処理を
 * 包括的にテストします。
 *
 * テストカバー範囲:
 * - 成功レスポンスの生成
 * - 各種エラーレスポンスの生成
 * - HTTPステータスコードの検証
 * - レスポンス形式の検証
 * - レガシーサポートの検証
 *
 * @author jugeeem
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/api';
import {
  error,
  forbidden,
  internalError,
  notFound,
  ResponseHelper,
  success,
  unauthorized,
} from '../response';

// NextResponse をモック化
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}));

describe('Response Helpers', () => {
  const mockNextResponse = NextResponse as jest.Mocked<typeof NextResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success', () => {
    it('データのみでレスポンスを生成する', () => {
      const testData = { id: '123', name: 'Test' };
      const expectedResponse = { success: true, data: testData };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      success(testData);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse);
      expect(mockNextResponse.json).toHaveBeenCalledTimes(1);
    });

    it('データとメッセージでレスポンスを生成する', () => {
      const testData = { id: '123', name: 'Test' };
      const message = 'データ取得成功';
      const expectedResponse = {
        success: true,
        data: testData,
        message,
      };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      success(testData, message);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('nullデータでも正しくレスポンスを生成する', () => {
      const testData = null;
      const expectedResponse = { success: true, data: testData };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      success(testData);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('配列データでレスポンスを生成する', () => {
      const testData = [{ id: '1' }, { id: '2' }];
      const expectedResponse = { success: true, data: testData };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      success(testData);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('プリミティブ型データでレスポンスを生成する', () => {
      const testData = 'simple string';
      const expectedResponse = { success: true, data: testData };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      success(testData);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('空文字列メッセージでレスポンスを生成する', () => {
      const testData = { id: '123' };
      const message = '';
      const expectedResponse = {
        success: true,
        data: testData,
        message,
      };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      success(testData, message);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse);
    });
  });

  describe('error', () => {
    it('デフォルトステータス（400）でエラーレスポンスを生成する', () => {
      const errorMessage = 'バリデーションエラー';
      const expectedResponse = { success: false, error: errorMessage };
      const expectedOptions = { status: 400 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      error(errorMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('カスタムステータスコードでエラーレスポンスを生成する', () => {
      const errorMessage = 'コンフリクトエラー';
      const status = 409;
      const expectedResponse = { success: false, error: errorMessage };
      const expectedOptions = { status };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      error(errorMessage, status);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('空文字列エラーメッセージでレスポンスを生成する', () => {
      const errorMessage = '';
      const expectedResponse = { success: false, error: errorMessage };
      const expectedOptions = { status: 400 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      error(errorMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('様々なHTTPステータスコードでレスポンスを生成する', () => {
      const errorMessage = 'テストエラー';
      const statusCodes = [422, 429, 502, 503];

      statusCodes.forEach((status) => {
        jest.clearAllMocks();
        mockNextResponse.json.mockReturnValue({} as NextResponse);

        error(errorMessage, status);

        expect(mockNextResponse.json).toHaveBeenCalledWith(
          { success: false, error: errorMessage },
          { status },
        );
      });
    });
  });

  describe('unauthorized', () => {
    it('デフォルトメッセージで401レスポンスを生成する', () => {
      const expectedResponse = { success: false, error: 'Unauthorized' };
      const expectedOptions = { status: 401 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      unauthorized();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('カスタムメッセージで401レスポンスを生成する', () => {
      const customMessage = '認証トークンが無効です';
      const expectedResponse = { success: false, error: customMessage };
      const expectedOptions = { status: 401 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      unauthorized(customMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('空文字列メッセージで401レスポンスを生成する', () => {
      const customMessage = '';
      const expectedResponse = { success: false, error: customMessage };
      const expectedOptions = { status: 401 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      unauthorized(customMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });
  });

  describe('forbidden', () => {
    it('デフォルトメッセージで403レスポンスを生成する', () => {
      const expectedResponse = { success: false, error: 'Forbidden' };
      const expectedOptions = { status: 403 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      forbidden();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('カスタムメッセージで403レスポンスを生成する', () => {
      const customMessage = '管理者権限が必要です';
      const expectedResponse = { success: false, error: customMessage };
      const expectedOptions = { status: 403 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      forbidden(customMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });
  });

  describe('notFound', () => {
    it('デフォルトメッセージで404レスポンスを生成する', () => {
      const expectedResponse = { success: false, error: 'Not found' };
      const expectedOptions = { status: 404 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      notFound();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('カスタムメッセージで404レスポンスを生成する', () => {
      const customMessage = 'ユーザーが見つかりません';
      const expectedResponse = { success: false, error: customMessage };
      const expectedOptions = { status: 404 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      notFound(customMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });
  });

  describe('internalError', () => {
    it('デフォルトメッセージで500レスポンスを生成する', () => {
      const expectedResponse = { success: false, error: 'Internal server error' };
      const expectedOptions = { status: 500 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      internalError();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('カスタムメッセージで500レスポンスを生成する', () => {
      const customMessage = 'データベース接続エラー';
      const expectedResponse = { success: false, error: customMessage };
      const expectedOptions = { status: 500 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      internalError(customMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });
  });

  describe('ResponseHelper (legacy support)', () => {
    it('ResponseHelper.success が正しく動作する', () => {
      const testData = { id: '123' };
      const expectedResponse = { success: true, data: testData };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      ResponseHelper.success(testData);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('ResponseHelper.error が正しく動作する', () => {
      const errorMessage = 'テストエラー';
      const expectedResponse = { success: false, error: errorMessage };
      const expectedOptions = { status: 400 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      ResponseHelper.error(errorMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('ResponseHelper.unauthorized が正しく動作する', () => {
      const expectedResponse = { success: false, error: 'Unauthorized' };
      const expectedOptions = { status: 401 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      ResponseHelper.unauthorized();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('ResponseHelper.forbidden が正しく動作する', () => {
      const expectedResponse = { success: false, error: 'Forbidden' };
      const expectedOptions = { status: 403 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      ResponseHelper.forbidden();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('ResponseHelper.notFound が正しく動作する', () => {
      const expectedResponse = { success: false, error: 'Not found' };
      const expectedOptions = { status: 404 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      ResponseHelper.notFound();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('ResponseHelper.internalError が正しく動作する', () => {
      const expectedResponse = { success: false, error: 'Internal server error' };
      const expectedOptions = { status: 500 };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      ResponseHelper.internalError();

      expect(mockNextResponse.json).toHaveBeenCalledWith(
        expectedResponse,
        expectedOptions,
      );
    });

    it('ResponseHelper が全ての関数を公開している', () => {
      expect(ResponseHelper).toHaveProperty('success');
      expect(ResponseHelper).toHaveProperty('error');
      expect(ResponseHelper).toHaveProperty('unauthorized');
      expect(ResponseHelper).toHaveProperty('forbidden');
      expect(ResponseHelper).toHaveProperty('notFound');
      expect(ResponseHelper).toHaveProperty('internalError');

      expect(typeof ResponseHelper.success).toBe('function');
      expect(typeof ResponseHelper.error).toBe('function');
      expect(typeof ResponseHelper.unauthorized).toBe('function');
      expect(typeof ResponseHelper.forbidden).toBe('function');
      expect(typeof ResponseHelper.notFound).toBe('function');
      expect(typeof ResponseHelper.internalError).toBe('function');
    });
  });

  describe('type safety', () => {
    it('success関数がジェネリック型を正しく処理する', () => {
      interface TestUser {
        id: string;
        name: string;
        email: string;
      }

      const userData: TestUser = {
        id: '123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const expectedResponse = { success: true, data: userData };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      success<TestUser>(userData);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('success関数がプリミティブ型を正しく処理する', () => {
      const numberData = 42;
      const stringData = 'hello';
      const booleanData = true;

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      success(numberData);
      expect(mockNextResponse.json).toHaveBeenCalledWith({
        success: true,
        data: numberData,
      });

      success(stringData);
      expect(mockNextResponse.json).toHaveBeenCalledWith({
        success: true,
        data: stringData,
      });

      success(booleanData);
      expect(mockNextResponse.json).toHaveBeenCalledWith({
        success: true,
        data: booleanData,
      });
    });
  });

  describe('response structure consistency', () => {
    it('成功レスポンスが統一された構造を持つ', () => {
      const testData = { test: 'value' };
      const message = 'Success message';

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      success(testData, message);

      const call = mockNextResponse.json.mock.calls[0];
      const response = call[0] as ApiResponse<typeof testData>;

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data', testData);
      expect(response).toHaveProperty('message', message);
      expect(response).not.toHaveProperty('error');
    });

    it('エラーレスポンスが統一された構造を持つ', () => {
      const errorMessage = 'Test error';
      const status = 400;

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      error(errorMessage, status);

      const call = mockNextResponse.json.mock.calls[0];
      const response = call[0] as ApiResponse;
      const options = call[1];

      expect(response).toHaveProperty('success', false);
      expect(response).toHaveProperty('error', errorMessage);
      expect(response).not.toHaveProperty('data');
      expect(response).not.toHaveProperty('message');
      expect(options).toEqual({ status });
    });

    it('各エラーヘルパーが適切なHTTPステータスコードを設定する', () => {
      const errorMessage = 'Test';

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      const errorHelpers = [
        { func: unauthorized, expectedStatus: 401 },
        { func: forbidden, expectedStatus: 403 },
        { func: notFound, expectedStatus: 404 },
        { func: internalError, expectedStatus: 500 },
      ];

      errorHelpers.forEach(({ func, expectedStatus }) => {
        jest.clearAllMocks();

        func(errorMessage);

        const call = mockNextResponse.json.mock.calls[0];
        const options = call[1];

        expect(options).toEqual({ status: expectedStatus });
      });
    });
  });

  describe('edge cases', () => {
    it('undefined データで成功レスポンスを生成する', () => {
      const testData = undefined;
      const expectedResponse = { success: true, data: testData };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      success(testData);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse);
    });

    it('非常に長いエラーメッセージを処理する', () => {
      const longErrorMessage = 'a'.repeat(1000);
      const expectedResponse = { success: false, error: longErrorMessage };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      error(longErrorMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse, {
        status: 400,
      });
    });

    it('特殊文字を含むメッセージを処理する', () => {
      const specialCharMessage = '特殊文字 !@#$%^&*()_+-=[]{}|;:,.<>?';
      const expectedResponse = { success: false, error: specialCharMessage };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      error(specialCharMessage);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse, {
        status: 400,
      });
    });

    it('0ステータスコードでエラーレスポンスを生成する', () => {
      const errorMessage = 'Zero status test';
      const expectedResponse = { success: false, error: errorMessage };

      mockNextResponse.json.mockReturnValue({} as NextResponse);

      error(errorMessage, 0);

      expect(mockNextResponse.json).toHaveBeenCalledWith(expectedResponse, {
        status: 0,
      });
    });
  });
});
