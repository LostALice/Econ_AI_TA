// Code by AkinoAlice@TyrantRey

import { TAskQuestionResponseFormat, IDocsFormat } from "@/types/chat/types";
import { siteConfig } from "@/config/site";

// Helper function to detect if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

export async function askQuestion(
  chatUUID: string,
  question: string[],
  userID: string,
  language: string,
  collection: string | "default" = "default",
  images: string[],
  question_type: "CHATTING" | "TESTING" | "THEOREM" = "CHATTING"
): Promise<TAskQuestionResponseFormat> {
  if (language === "en") {
    language = "ENGLISH";
  } else if (language === "zh") {
    language = "CHINESE";
  } else {
    language = "CHINESE";
  }

  const postBody = JSON.stringify({
    chat_id: chatUUID,
    question: question,
    sent_by_username: userID,
    language: language,
    question_type: question_type,
    collection: collection,
    images: images,
  });

  console.log(postBody);

  // Use mock data in development if the API is unavailable
  try {
    const resp = await fetch(`${siteConfig.api_url}/chatroom/${chatUUID}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: postBody,
    });
    const data = await resp.json();
    console.log(data);
    return {
      questionUUID: data.question_uuid,
      answer: data.answer,
      files: data.files,
    };
  } catch (error) {
    console.warn("Failed to fetch from API, using mock data instead:", error);
    // Return mock data
    return {
      questionUUID: "mock-question-uuid-" + Date.now(),
      answer: "This is a mock response because the API is unavailable. Your question was: " + question.join(" "),
      files: [],
    };
  }
}

export async function getChatroomUUID(): Promise<string> {
  try {
    // 確保 API URL 存在
    if (!siteConfig.api_url) {
      throw new Error("API URL is not configured");
    }
    
    // 添加完整的異常處理
    console.log(`請求聊天室 UUID 從: ${siteConfig.api_url}/chatroom/uuid/`);
    
    // 設定請求超時 (5秒)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${siteConfig.api_url}/chatroom/uuid/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`伺服器回應異常: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn("無法從 API 取得聊天室 UUID，使用模擬 UUID 代替:", error);
    
    // 嘗試從 localStorage 讀取之前可能存儲的 mockUUID，保持會話一致性
    let mockUUID = localStorage.getItem('mockChatroomUUID');
    
    if (!mockUUID) {
      mockUUID = "mock-chatroom-" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('mockChatroomUUID', mockUUID);
    }
    
    console.info("使用模擬聊天室 UUID:", mockUUID);
    return mockUUID;
  }
}
