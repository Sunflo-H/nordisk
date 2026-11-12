import type { FilterOptionsType, ProductType } from "../types";

// 필터 항목 목록 (/inventory 필터 오버레이와 행사장 상품 선택 영역이 함께 쓴다)
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
