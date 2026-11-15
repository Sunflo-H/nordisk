// 날짜를 브라우저 현지 시간 기준 "YYYY-MM-DD" 문자열로 바꾼다.
// (toISOString은 UTC 기준이라 한국 시간 오전 9시 전에는 하루 전 날짜가 나오므로 쓰지 않는다)
export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
