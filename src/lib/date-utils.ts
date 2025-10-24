/**
 * @fileoverview JST日時ユーティリティ
 *
 * このファイルは、システム全体で一貫したJST（日本標準時）の日時処理を提供します。
 * date-fnsとdate-fns-tzを使用して、全ての日時オブジェクトがJSTで管理されることを保証します。
 *
 * 主な機能:
 * - 現在のJST日時取得
 * - 任意の日時をJSTに変換
 * - ISO文字列からJST日時への変換
 * - データベース用のJST日時生成
 *
 * 設計方針:
 * - システム内では常にDate型でJST時刻を表現
 * - データベース保存時もJSTで保存
 * - タイムゾーンの混在を防ぐため、このモジュールを経由して日時を生成
 *
 * @author jugeeem
 * @since 1.0.0
 */

import { fromZonedTime, toZonedTime } from 'date-fns-tz';

/**
 * 日本標準時のタイムゾーン識別子
 */
const JST_TIMEZONE = 'Asia/Tokyo';

/**
 * 現在のJST日時を取得
 *
 * システムのタイムゾーンに関わらず、常に日本標準時（JST）の
 * 現在日時を返します。
 *
 * @returns {Date} 現在のJST日時
 *
 * @example
 * ```typescript
 * const now = nowJST();
 * console.log(now); // 現在のJST時刻
 *
 * // データベース保存用
 * const user = {
 *   createdAt: nowJST(),
 *   updatedAt: nowJST()
 * };
 * ```
 */
export function nowJST(): Date {
  return toZonedTime(new Date(), JST_TIMEZONE);
}

/**
 * 任意の日時をJSTに変換
 *
 * 指定された日時オブジェクトをJSTに変換します。
 * 入力がすでにJSTの場合でも、正しく処理されます。
 *
 * @param {Date} date - 変換元の日時
 * @returns {Date} JSTに変換された日時
 *
 * @example
 * ```typescript
 * const utcDate = new Date('2024-01-01T00:00:00Z');
 * const jstDate = toJST(utcDate);
 * // JST: 2024-01-01 09:00:00
 * ```
 */
export function toJST(date: Date): Date {
  return toZonedTime(date, JST_TIMEZONE);
}

/**
 * ISO文字列からJST日時を生成
 *
 * ISO 8601形式の文字列をパースし、JSTの日時オブジェクトを返します。
 * データベースから取得した日時文字列の変換に使用します。
 *
 * @param {string} isoString - ISO 8601形式の日時文字列
 * @returns {Date} JSTの日時オブジェクト
 *
 * @example
 * ```typescript
 * // データベースから取得した文字列
 * const dbTimestamp = '2024-01-01T00:00:00.000Z';
 * const jstDate = fromISOStringToJST(dbTimestamp);
 * ```
 */
export function fromISOStringToJST(isoString: string): Date {
  return toZonedTime(new Date(isoString), JST_TIMEZONE);
}

/**
 * JSTの日時からUTC基準のDateオブジェクトを生成
 *
 * JST時刻として解釈した値を、UTCベースのDateオブジェクトに変換します。
 * データベース保存時など、JSTの時刻をそのままの値で保存したい場合に使用します。
 *
 * @param {Date} jstDate - JST時刻として解釈するDateオブジェクト
 * @returns {Date} UTC基準のDateオブジェクト（JST時刻の値を持つ）
 *
 * @example
 * ```typescript
 * const jstTime = new Date('2024-01-01T09:00:00'); // JST 9:00
 * const utcBased = fromJSTToUTC(jstTime);
 * // データベースには '2024-01-01T09:00:00Z' として保存される
 * ```
 */
export function fromJSTToUTC(jstDate: Date): Date {
  return fromZonedTime(jstDate, JST_TIMEZONE);
}

/**
 * 日時が有効かチェック
 *
 * 指定された値が有効なDateオブジェクトかどうかを検証します。
 *
 * @param {unknown} date - チェック対象の値
 * @returns {boolean} 有効なDateオブジェクトの場合true
 *
 * @example
 * ```typescript
 * isValidDate(new Date()); // true
 * isValidDate(new Date('invalid')); // false
 * isValidDate('2024-01-01'); // false
 * isValidDate(null); // false
 * ```
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

/**
 * データベース用のJST日時を生成
 *
 * データベース保存用のJST日時を生成します。
 * created_at、updated_at等のタイムスタンプフィールドに使用します。
 *
 * @returns {Date} データベース保存用のJST日時
 *
 * @example
 * ```typescript
 * const query = `
 *   INSERT INTO users (id, username, created_at, updated_at)
 *   VALUES ($1, $2, $3, $4)
 * `;
 * const values = [id, username, dbNowJST(), dbNowJST()];
 * ```
 */
export function dbNowJST(): Date {
  return nowJST();
}

/**
 * データベース取得値をJST日時に変換
 *
 * データベースから取得した日時値をJSTのDateオブジェクトに変換します。
 * 文字列、Date、nullなど様々な形式に対応します。
 *
 * @param {unknown} value - データベースから取得した日時値
 * @returns {Date | null} JSTの日時オブジェクト、無効な値の場合はnull
 *
 * @example
 * ```typescript
 * const row = await db.query('SELECT created_at FROM users WHERE id = $1', [userId]);
 * const createdAt = dbValueToJST(row.created_at);
 * if (createdAt) {
 *   console.log('作成日時:', createdAt);
 * }
 * ```
 */
export function dbValueToJST(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return toJST(value);
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return isValidDate(date) ? toJST(date) : null;
  }

  return null;
}
