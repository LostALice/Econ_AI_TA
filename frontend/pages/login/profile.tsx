import { useContext, useState } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import DefaultLayout from "@/layouts/default";
import { Card, CardHeader, CardBody, CardFooter, Divider, Button, Input, Chip, addToast } from "@heroui/react";
import { setCookie, getCookie, hasCookie } from "cookies-next";

export default function ProfilePage() {
  const { userInfo, isLoggedIn, role } = useContext(AuthContext);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: userInfo?.email || "",
    studentId: userInfo?.studentId || "",
    department: userInfo?.department || "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  // 如果未登入，重定向到登入頁面
  if (!isLoggedIn) {
    if (typeof window !== "undefined") {
      router.push("/login");
    }
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // 在生產環境中，這裡應該發送請求到後端 API 來更新用戶資訊
      // 目前我們使用模擬的方式，僅更新前端數據

      // 從 localStorage 獲取所有用戶數據（僅用於模擬驗證）
      const users = JSON.parse(localStorage.getItem('users') || '[]');

      // 找到當前用戶
      const userIndex = users.findIndex((u: any) => u.id === userInfo?.id);

      if (userIndex === -1) {
        setMessage({ type: "error", text: "無法更新個人資料，找不到用戶資訊" });
        addToast({
          color: "danger",
          title: "更新失敗",
          description: "無法更新個人資料，找不到用戶資訊"
        });
        return;
      }

      // 更新用戶資料（保留敏感欄位不變）
      users[userIndex] = {
        ...users[userIndex],
        email: formData.email,
        studentId: formData.studentId,
        department: formData.department,
      };

      // 更新 localStorage（僅用於模擬）
      localStorage.setItem('users', JSON.stringify(users));

      // 準備更新後的用戶信息
      const updatedUserInfo = {
        ...userInfo,
        email: formData.email,
        studentId: formData.studentId,
        department: formData.department,
      };

      // 更新 Cookie 中的用戶資訊
      const cookieOptions = {
        maxAge: 7 * 24 * 60 * 60, // 7天有效期
        secure: process.env.NODE_ENV === "production", // 生產環境使用 HTTPS
        sameSite: "strict" as const  // 防止 CSRF
      };
      
      setCookie("userInfo", JSON.stringify(updatedUserInfo), cookieOptions);

      // 顯示成功訊息
      setMessage({ type: "success", text: "個人資料已成功更新！" });
      addToast({
        color: "success",
        title: "更新成功",
        description: "個人資料已成功更新！"
      });

      // 關閉編輯模式
      setIsEditing(false);

      // 稍後清除訊息
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("更新個人資料失敗:", error);
      setMessage({ type: "error", text: "更新個人資料發生錯誤，請稍後再試" });
      addToast({
        color: "danger",
        title: "更新失敗",
        description: "更新個人資料發生錯誤，請稍後再試"
      });
    }
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <Card className="w-full">
          <CardHeader className="flex flex-col items-start gap-2">
            <div className="flex justify-between items-center w-full">
              <h1 className="text-2xl font-bold">個人資料</h1>
              <Chip color="primary" variant="flat">{role}</Chip>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              查看和管理您的個人資訊
            </p>
          </CardHeader>
          <Divider />
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 顯示唯讀的用戶ID */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">用戶 ID</label>
                <Input
                  value={userInfo?.id || ""}
                  isReadOnly
                  type="text"
                  variant="flat"
                  classNames={{
                    input: "bg-gray-100 dark:bg-gray-800"
                  }}
                />
              </div>

              {/* 電子郵件 */}
              <Input
                type="email"
                name="email"
                label="電子郵件"
                placeholder="輸入您的電子郵件"
                value={formData.email}
                onChange={handleChange}
                isReadOnly={!isEditing}
                variant={isEditing ? "bordered" : "flat"}
                classNames={{
                  input: !isEditing ? "bg-gray-100 dark:bg-gray-800" : ""
                }}
              />

              {/* 學號 */}
              <Input
                type="text"
                name="studentId"
                label="學號"
                placeholder="輸入您的學號"
                value={formData.studentId}
                onChange={handleChange}
                isReadOnly={!isEditing}
                variant={isEditing ? "bordered" : "flat"}
                classNames={{
                  input: !isEditing ? "bg-gray-100 dark:bg-gray-800" : ""
                }}
              />

              {/* 系所 */}
              <Input
                type="text"
                name="department"
                label="系所"
                placeholder="輸入您的系所"
                value={formData.department}
                onChange={handleChange}
                isReadOnly={!isEditing}
                variant={isEditing ? "bordered" : "flat"}
                classNames={{
                  input: !isEditing ? "bg-gray-100 dark:bg-gray-800" : ""
                }}
              />

              {/* 顯示訊息 */}
              {message.text && (
                <div className={`p-3 rounded-md ${message.type === "success"
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                  {message.text}
                </div>
              )}
            </form>
          </CardBody>
          <Divider />
          <CardFooter className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button
                  color="default"
                  variant="flat"
                  onPress={() => {
                    setIsEditing(false);
                    setFormData({
                      email: userInfo?.email || "",
                      studentId: userInfo?.studentId || "",
                      department: userInfo?.department || "",
                    });
                  }}
                >
                  取消
                </Button>
                <Button
                  color="primary"
                  onClick={handleSubmit}
                >
                  儲存更改
                </Button>
              </>
            ) : (
              <Button
                color="primary"
                onPress={() => setIsEditing(true)}
              >
                編輯個人資料
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </DefaultLayout>
  );
}