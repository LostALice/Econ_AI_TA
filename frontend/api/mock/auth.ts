// Code by AkinoAlice@TyrantRey
// 模擬認證 API，包含預設帳號

import { sha3_256 } from "js-sha3";

// 預設使用者列表
export const mockUsers = [
  {
    id: "teacher001",
    username: "teacher@fcu.edu.tw",
    password: sha3_256("teacher123"), // 密碼: teacher123
    role: "teacher",
    name: "王大明",
    email: "teacher@fcu.edu.tw",
    department: "經濟系",
    studentId: "", // 教師無學號
    createdAt: "2025-01-01T00:00:00Z",
    lastLogin: "2025-05-01T09:30:00Z"
  },
  {
    id: "ta001",
    username: "ta@fcu.edu.tw",
    password: sha3_256("ta123"), // 密碼: ta123
    role: "ta",
    name: "李小華",
    email: "ta@fcu.edu.tw",
    department: "經濟系",
    studentId: "D12345678",
    createdAt: "2025-01-05T00:00:00Z",
    lastLogin: "2025-05-01T10:15:00Z"
  },
  {
    id: "student001",
    username: "student@mail.fcu.edu.tw",
    password: sha3_256("student123"), // 密碼: student123
    role: "student",
    name: "張小明",
    email: "student@mail.fcu.edu.tw",
    department: "經濟系",
    studentId: "D87654321",
    createdAt: "2025-01-10T00:00:00Z",
    lastLogin: "2025-05-01T11:00:00Z"
  }
];

// 模擬登入函數
export const mockLogin = (username: string, password: string, role: string) => {
  // 尋找符合條件的用戶
  const user = mockUsers.find(u => 
    u.username.toLowerCase() === username.toLowerCase() && 
    u.password === password &&
    u.role === role
  );

  if (user) {
    // 模擬 JWT 令牌
    const jwtToken = `mock-jwt-${user.id}-${Date.now()}`;
    
    // 創建要返回的用戶資料 (不包含密碼)
    const userInfo = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      department: user.department,
      studentId: user.studentId,
      lastLogin: new Date().toISOString()
    };
    
    // 將完整用戶資訊存入 localStorage，模擬後端處理
    localStorage.setItem('currentUser', JSON.stringify(userInfo));
    
    // 更新用戶最後登入時間
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const existingUserIndex = users.findIndex((u: any) => u.id === user.id);
    
    if (existingUserIndex >= 0) {
      users[existingUserIndex] = {
        ...users[existingUserIndex],
        lastLogin: new Date().toISOString()
      };
    } else {
      users.push({
        ...userInfo,
        lastLogin: new Date().toISOString()
      });
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    
    return {
      success: true,
      message: "登入成功",
      jwt_token: jwtToken,
      role: user.role,
      userInfo
    };
  }
  
  return {
    success: false,
    message: "帳號、密碼或身分別錯誤，請重新確認"
  };
};

// 初始化預設用戶
export const initMockUsers = () => {
  // 檢查是否已經初始化過
  if (!localStorage.getItem('usersInitialized')) {
    localStorage.setItem('users', JSON.stringify(mockUsers));
    localStorage.setItem('usersInitialized', 'true');
    console.log('預設用戶已初始化');
  }
};