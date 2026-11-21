import type { FilterOptionsType, ProductType } from "../types";

// 필터 항목 목록 (공용 목록의 검색·필터와 행사장 상품 선택 영역이 함께 쓴다)
export const yearOptions = ["27", "26", "25", "24", "23"];
export const genderOptions = ["공용", "남성", "여성", "키즈"];
export const categoryOptions = [
  "자켓",
  "티셔츠",
  "바지",
  "셔츠",
  "패딩",
  "베스트",
  "용품",
  "스웨터",
  "원피스",
  "큐롯",
  "등산화",
  "일반 신발",
  // "반팔티셔츠",
  "모자",
  "장갑",
  "양말",
  "가방",
  "캠핑용품",
  // "속옷",
  // "고어텍스",
];

export const emptyFilterOptions: FilterOptionsType = {
  year: [],
  gender: [],
  category: [],
};

// 데이터와 필터 옵션을 받아 필터링한 데이터를 반환하는 함수
// 같은 항목 안은 OR, 항목끼리는 AND. 고른 값이 없는 항목은 거르지 않는다.
export function getFilteredData(
  productsData: ProductType[],
  filterOptions: FilterOptionsType
) {
  const { year, gender, category } = filterOptions;

  return productsData.filter((product) => {
    const matchesYear =
      year.length === 0 || year.includes(product.연도.toString());
    const matchesGender = gender.length === 0 || gender.includes(product.성별);
    const matchesCategory =
      category.length === 0 || category.includes(product.카테고리);
    return matchesYear && matchesGender && matchesCategory;
  });
}

// 필터 항목별로 상품에서 비교할 값을 꺼내는 함수
const getProductValue: Record<
  keyof FilterOptionsType,
  (product: ProductType) => string
> = {
  year: (product) => product.연도.toString(),
  gender: (product) => product.성별,
  category: (product) => product.카테고리,
};

// 상품코드·상품명에 검색어가 들어 있는지 (대소문자 구분 없음). 빈 검색어는 모두 통과.
// 칼라 코드는 검색하지 않는다 (spec.md "검색·필터").
export function matchesKeyword(product: ProductType, keyword: string): boolean {
  const query = keyword.trim().toLowerCase();
  if (!query) return true;
  return (
    product.상품코드.toLowerCase().includes(query) ||
    (product.상품명 ?? "").toLowerCase().includes(query)
  );
}

// 검색어와 칩 필터를 함께(AND) 건 결과
export function getSearchedFilteredData(
  productsData: ProductType[],
  keyword: string,
  filterOptions: FilterOptionsType
): ProductType[] {
  return getFilteredData(
    productsData.filter((product) => matchesKeyword(product, keyword)),
    filterOptions
  );
}

// 필터 항목(연도/성별/카테고리) 하나의 칩별 상품 수를 실시간으로 센다.
// 칩 하나의 수 = 그 칩을 눌렀을 때 나올 상품 수: 검색어와 다른 항목에서 고른 칩은 모두 걸고,
// 같은 항목 안의 선택은 뺀다 (같은 항목 안은 OR이라서).
export function countProductsByOption(
  productsData: ProductType[],
  key: keyof FilterOptionsType,
  keyword = "",
  filterOptions: FilterOptionsType = emptyFilterOptions
): Record<string, number> {
  const base = getSearchedFilteredData(productsData, keyword, {
    ...filterOptions,
    [key]: [],
  });
  const counts: Record<string, number> = {};
  for (const product of base) {
    const value = getProductValue[key](product);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

// 고른 칩 개수 합계
export function countSelectedOptions(filterOptions: FilterOptionsType) {
  return (
    filterOptions.year.length +
    filterOptions.gender.length +
    filterOptions.category.length
  );
}

