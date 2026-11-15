import { useState } from "react";

// 매장 판매 표시 이름을 보관하는 localStorage 키.
// 실제 이름은 개인정보라 코드·문서·DB에 적지 않고, 이 브라우저에만 저장한다.
const STORAGE_KEY = "nordisk.restock.storeSaleName";

// localStorage는 사생활 보호 모드 등에서 예외를 던질 수 있어 모두 try/catch로 감싼다
function readStoredName(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeStoredName(name: string): void {
  try {
    if (name) window.localStorage.setItem(STORAGE_KEY, name);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 저장하지 못해도 화면 입력값은 그대로 쓴다
  }
}

type UseStoreSaleNameResult = {
  // 입력칸에 보이는 이름 (앞뒤 공백 포함 그대로)
  storeSaleName: string;
  // 입력값을 바꾸고 바로 localStorage에 저장한다
  setStoreSaleName: (name: string) => void;
};

// 매장 판매 표시 이름을 이 브라우저의 localStorage에서 읽고 쓰는 훅
function useStoreSaleName(): UseStoreSaleNameResult {
  const [storeSaleName, setName] = useState<string>(readStoredName);

  const setStoreSaleName = (name: string) => {
    setName(name);
    writeStoredName(name);
  };

  return { storeSaleName, setStoreSaleName };
}

export default useStoreSaleName;
