const THAI_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
const BUDDHIST_YEAR_OFFSET = 543;

/**
 * แปลงวันที่จาก format ไทย DD/MM/BBBB (พ.ศ.) เป็น ISO YYYY-MM-DD (ค.ศ.)
 * ถ้าเป็น ISO อยู่แล้วหรือ parse ไม่ได้ จะคืนค่าตามที่ได้รับ (หรือ null ถ้า input เป็น null/ว่าง)
 */
export function toIsoDate(value: string | null): string | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const match = trimmed.match(THAI_DATE_PATTERN);
  if (!match) return trimmed;

  const [, day, month, buddhistYear] = match;
  const year = Number(buddhistYear) - BUDDHIST_YEAR_OFFSET;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
