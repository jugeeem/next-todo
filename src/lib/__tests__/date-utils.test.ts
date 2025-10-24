/**
 * @fileoverview JST日時ユーティリティのテスト
 */

import {
  dbNowJST,
  dbValueToJST,
  fromISOStringToJST,
  isValidDate,
  nowJST,
  toJST,
} from '../date-utils';

describe('JST日時ユーティリティ', () => {
  describe('nowJST', () => {
    it('現在のJST日時を返すこと', () => {
      const now = nowJST();
      expect(now).toBeInstanceOf(Date);
      expect(isValidDate(now)).toBe(true);
    });

    it('複数回呼び出しても有効な日時を返すこと', () => {
      const now1 = nowJST();
      const now2 = nowJST();
      expect(now1).toBeInstanceOf(Date);
      expect(now2).toBeInstanceOf(Date);
      expect(now2.getTime()).toBeGreaterThanOrEqual(now1.getTime());
    });
  });

  describe('toJST', () => {
    it('UTC日時をJSTに変換すること', () => {
      const utcDate = new Date('2024-01-01T00:00:00Z');
      const jstDate = toJST(utcDate);
      expect(jstDate).toBeInstanceOf(Date);
      expect(isValidDate(jstDate)).toBe(true);
    });

    it('日付オブジェクトを正しく処理すること', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const jstDate = toJST(date);
      expect(jstDate).toBeInstanceOf(Date);
    });
  });

  describe('fromISOStringToJST', () => {
    it('ISO文字列からJST日時を生成すること', () => {
      const isoString = '2024-01-01T00:00:00.000Z';
      const jstDate = fromISOStringToJST(isoString);
      expect(jstDate).toBeInstanceOf(Date);
      expect(isValidDate(jstDate)).toBe(true);
    });

    it('様々なISO形式の文字列を処理できること', () => {
      const formats = [
        '2024-01-01T00:00:00Z',
        '2024-01-01T00:00:00.000Z',
        '2024-12-31T23:59:59Z',
      ];

      formats.forEach((format) => {
        const jstDate = fromISOStringToJST(format);
        expect(jstDate).toBeInstanceOf(Date);
        expect(isValidDate(jstDate)).toBe(true);
      });
    });
  });

  describe('isValidDate', () => {
    it('有効なDateオブジェクトに対してtrueを返すこと', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate(new Date('2024-01-01'))).toBe(true);
    });

    it('無効な値に対してfalseを返すこと', () => {
      expect(isValidDate(new Date('invalid'))).toBe(false);
      expect(isValidDate('2024-01-01')).toBe(false);
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate(123456789)).toBe(false);
      expect(isValidDate({})).toBe(false);
    });
  });

  describe('dbNowJST', () => {
    it('データベース用のJST日時を返すこと', () => {
      const dbNow = dbNowJST();
      expect(dbNow).toBeInstanceOf(Date);
      expect(isValidDate(dbNow)).toBe(true);
    });

    it('nowJSTと同じ動作をすること', () => {
      const dbNow = dbNowJST();
      const now = nowJST();
      // ほぼ同時刻（1秒以内の差）
      expect(Math.abs(dbNow.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });

  describe('dbValueToJST', () => {
    it('Date型をJSTに変換すること', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const jstDate = dbValueToJST(date);
      expect(jstDate).toBeInstanceOf(Date);
      if (jstDate) {
        expect(isValidDate(jstDate)).toBe(true);
      }
    });

    it('ISO文字列をJSTに変換すること', () => {
      const isoString = '2024-01-01T00:00:00.000Z';
      const jstDate = dbValueToJST(isoString);
      expect(jstDate).toBeInstanceOf(Date);
      if (jstDate) {
        expect(isValidDate(jstDate)).toBe(true);
      }
    });

    it('null/undefinedに対してnullを返すこと', () => {
      expect(dbValueToJST(null)).toBeNull();
      expect(dbValueToJST(undefined)).toBeNull();
    });

    it('無効な文字列に対してnullを返すこと', () => {
      expect(dbValueToJST('invalid-date')).toBeNull();
      expect(dbValueToJST('not a date')).toBeNull();
    });

    it('無効な型に対してnullを返すこと', () => {
      expect(dbValueToJST(123456)).toBeNull();
      expect(dbValueToJST({})).toBeNull();
      expect(dbValueToJST([])).toBeNull();
    });
  });
});
