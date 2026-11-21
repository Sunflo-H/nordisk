// 날짜를 브라우저 현지 시간 기준 "YYYY-MM-DD" 문자열로 바꾼다.
// (toISOString은 UTC 기준이라 한국 시간 오전 9시 전에는 하루 전 날짜가 나오므로 쓰지 않는다)
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 날짜·시각을 현지 시간대를 붙인 ISO 형식으로 바꾼다. 예: "2026-11-21T14:03:12+09:00"
export function toLocalDateTimeString(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  // getTimezoneOffset은 UTC − 현지 시각(분)이라 한국은 -540
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
  const offsetMinutes = pad(Math.abs(offset) % 60);
  return (
    `${toLocalDateString(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${offsetHours}:${offsetMinutes}`
  );
}
