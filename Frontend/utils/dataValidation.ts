// Code by wonmeow

import { IExcelQuestion } from "@/types/global";

/**
 * 驗證並修正題目資料，確保所有欄位都是有效的
 * @param question 原始題目資料
 * @returns 驗證並修正後的題目資料
 */
export const validateQuestion = (question: any): IExcelQuestion => {
  // 確保 options 始終為有效陣列
  let validOptions: string[] = [];

  if (Array.isArray(question.options)) {
    validOptions = question.options.filter(
      (opt: any) => opt && typeof opt === "string" && opt.trim() !== ""
    );
  }

  // 如果沒有有效選項，提供預設選項
  if (validOptions.length === 0) {
    validOptions = ["選項 A", "選項 B", "選項 C", "選項 D"];
    console.warn(
      `題目 "${question.question || question.id}" 沒有有效選項，使用預設選項`
    );
  }

  // 確保至少有4個選項
  while (validOptions.length < 4) {
    validOptions.push(`選項 ${String.fromCharCode(65 + validOptions.length)}`);
  }

  return {
    id: question.id || "unknown",
    question: question.question || "未定義題目",
    options: validOptions,
    answer: question.answer || "",
    category: question.category || "",
    difficulty: question.difficulty || "普通",
    modified: question.modified || false,
    deleted: question.deleted || false,
    picture: question.picture,
    pictures: Array.isArray(question.pictures) ? question.pictures : undefined,
  };
};

/**
 * 驗證題目陣列，確保每個題目都是有效的
 * @param questions 題目陣列
 * @returns 驗證並修正後的題目陣列
 */
export const validateQuestions = (questions: any[]): IExcelQuestion[] => {
  if (!Array.isArray(questions)) {
    console.warn("題目資料不是陣列，返回空陣列");
    return [];
  }

  return questions.map((q, index) => {
    try {
      return validateQuestion(q);
    } catch (error) {
      console.error(`驗證題目 ${index + 1} 時發生錯誤:`, error);
      // 返回一個基本的題目結構
      return {
        id: (index + 1).toString(),
        question: "題目資料損壞",
        options: ["選項 A", "選項 B", "選項 C", "選項 D"],
        answer: "",
        category: "",
        difficulty: "普通",
        modified: false,
        deleted: false,
      };
    }
  });
};

/**
 * 檢查題目資料的完整性
 * @param question 題目資料
 * @returns 檢查結果
 */
export const checkQuestionIntegrity = (
  question: any
): {
  isValid: boolean;
  issues: string[];
  warnings: string[];
} => {
  const issues: string[] = [];
  const warnings: string[] = [];

  // 檢查必要欄位
  if (
    !question.question ||
    typeof question.question !== "string" ||
    question.question.trim() === ""
  ) {
    issues.push("缺少題目內容");
  }

  if (!Array.isArray(question.options)) {
    issues.push("選項不是陣列");
  } else {
    const validOptions = question.options.filter(
      (opt: any) => opt && typeof opt === "string" && opt.trim() !== ""
    );
    if (validOptions.length === 0) {
      warnings.push("沒有有效選項");
    } else if (validOptions.length < 4) {
      warnings.push(`只有 ${validOptions.length} 個有效選項，建議至少4個`);
    }
  }

  if (!question.answer || typeof question.answer !== "string") {
    warnings.push("缺少答案");
  }

  if (!question.id) {
    warnings.push("缺少題目ID");
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
  };
};

/**
 * 修復損壞的題目資料
 * @param question 可能損壞的題目資料
 * @param index 題目索引（用於生成預設ID）
 * @returns 修復後的題目資料
 */
export const repairQuestion = (
  question: any,
  index: number = 0
): IExcelQuestion => {
  const repaired: any = { ...question };

  // 修復ID
  if (!repaired.id) {
    repaired.id = (index + 1).toString();
  }

  // 修復題目內容
  if (!repaired.question || typeof repaired.question !== "string") {
    repaired.question = `題目 ${index + 1}`;
  }

  // 修復選項
  if (!Array.isArray(repaired.options)) {
    repaired.options = [];
  }

  // 確保有4個有效選項
  const validOptions = repaired.options.filter(
    (opt: any) => opt && typeof opt === "string" && opt.trim() !== ""
  );
  while (validOptions.length < 4) {
    validOptions.push(`選項 ${String.fromCharCode(65 + validOptions.length)}`);
  }
  repaired.options = validOptions;

  // 修復其他欄位
  if (!repaired.answer) {
    repaired.answer = "";
  }

  if (!repaired.category) {
    repaired.category = "";
  }

  if (!repaired.difficulty) {
    repaired.difficulty = "普通";
  }

  if (typeof repaired.modified !== "boolean") {
    repaired.modified = false;
  }

  return validateQuestion(repaired);
};

/**
 * 批量修復題目陣列
 * @param questions 可能損壞的題目陣列
 * @returns 修復後的題目陣列
 */
export const repairQuestions = (questions: any[]): IExcelQuestion[] => {
  if (!Array.isArray(questions)) {
    console.warn("輸入不是陣列，返回空陣列");
    return [];
  }

  return questions.map((q, index) => repairQuestion(q, index));
};
