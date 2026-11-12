# 노르디스크 재고 관리

## 스택
- Vite 6 + React 19 + TypeScript 5.8
- Tailwind CSS v4 (`@tailwindcss/vite`), react-icons
- react-router v7 (`BrowserRouter`)
- Firebase Realtime Database (`src/firebase/`)
- xlsx (엑셀 파일 읽기)

## 확인 명령어
- 빌드(타입 검사 포함): `npm run build`
- 린트: `npm run lint`
  - 기존 파일에 원래 있던 린트 에러 3개(`ExcelManager.tsx`, `ProductModal.tsx`)는 따로 정리하기 전까지 기준에서 뺀다. **새로 만들거나 고친 파일에서는 린트 에러가 없어야 한다.**
- 개발 서버: `npm run dev`
- 테스트: 아직 없음

## 코딩 규칙
- 상품 데이터 필드명은 DB와 같은 한글 키(`상품코드`, `칼라`, `재고` 등)를 그대로 쓴다.
- **기기별 권한:** 모바일은 읽기 전용이다. 데이터를 바꾸는 기능(엑셀 업로드, 데이터 삭제, 행사장 상품 편집 등)은 PC(`sm` 이상)에서만 보이게 한다 (`hidden sm:flex` 등). 단, CSS로 숨기기만 하므로 실제 접근 제어는 아니다.
- 요구사항은 `spec.md`, 구현 단계와 통과 조건은 `PLAN.md`를 기준으로 한다.
  - Phase는 번호 순서대로 진행하고, 한 Phase를 마치면 멈춘다. 사용자가 "다음 진행해"라고 해야 다음 Phase로 넘어간다.
  - 통과 조건은 실제로 확인한 뒤에만 `[x]`로 표시한다. `[AI]` 항목은 직접 실행해 확인하고, `[사용자]` 항목은 사용자 확인을 받는다.
