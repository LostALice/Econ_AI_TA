import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default"
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

import NextLink from "next/link";

import { Card, CardBody } from "@heroui/card";
import { Image } from "@heroui/image";
import { Button } from "@heroui/react";

// 更新學生身份的內容，將基於課程的布局改為功能導向的布局
const roleSpecificContent = {
  "未登入": {
    title: "經濟學課程智能TA",
    description: "登入後體驗完整功能，獲取專業的經濟學學習資源和指導。",
    features: [],
    courses: []
  },
  "學生": {
    title: "學生學習中心",
    description: "歡迎來到經濟學課程智能TA的專屬頁面，在這裡，無論你有關於經濟學理論、數據分析、作業輔導，還是任何其他相關問題，我都樂意提供幫助。",
    // 移除課程卡片，改為功能入口
    features: [
      {
        href: "/courses/question-download",
        title: "題庫",
        description: "練習大一經濟學原理與公務員高普考題目",
        icon: "📚",
        color: "bg-blue-500 dark:bg-blue-600"
      },
      {
        href: "/courses/exams",
        title: "線上測驗",
        description: "參與模擬考試，檢測學習成效",
        icon: "📝",
        color: "bg-purple-500 dark:bg-purple-600"
      },
      {
        href: "/courses/chat",
        title: "智能TA對話",
        description: "獲得即時解答與學習指導",
        icon: "💬",
        color: "bg-green-500 dark:bg-green-600"
      },
      {
        href: "/courses/records",
        title: "學習紀錄",
        description: "查看個人學習進度與成績",
        icon: "📊",
        color: "bg-amber-500 dark:bg-amber-600"
      }
    ],
    courses: [] // 不再使用課程卡片
  },
  "教師": {
    title: "教師管理平台",
    description: "管理課程內容、查看學生進度與題庫上傳",
    // 教師功能保持不變
    features: [
      {
        href: "/courses/question-bank",
        title: "題庫上傳",
        description: "上傳與管理所有課程的題庫資源",
        icon: "📤",
        color: "bg-yellow-500 dark:bg-yellow-600"
      },
      {
        href: "/teacher/classes",
        title: "課程與班級管理",
        description: "管理所有課程內容與學生班級",
        icon: "👨‍🏫",
        color: "bg-green-500 dark:bg-green-600"
      },
      {
        href: "/teacher/performance",
        title: "學生表現",
        description: "查看與分析所有學生學習數據",
        icon: "📊",
        color: "bg-blue-500 dark:bg-blue-600"
      }
    ],
    courses: [] // 教師不顯示課程卡片
  },
  "助教": {
    title: "助教支援系統",
    description: "協助管理課程、回答學生問題並提供學習支援",
    // 助教功能保持不變
    features: [
      {
        href: "/courses/question-bank",
        title: "題庫上傳",
        description: "協助上傳與管理課程題庫資源",
        icon: "📤",
        color: "bg-orange-500 dark:bg-orange-600"
      },
      {
        href: "/ta/performance",
        title: "學生表現",
        description: "分析學生學習數據與進度",
        icon: "📊",
        color: "bg-teal-500 dark:bg-teal-600"
      }
    ],
    courses: [] // 助教不顯示課程卡片
  }
};

export default function MainPage() {
  const { role, userInfo } = useContext(AuthContext);
  const router = useRouter();
  const isLoggedIn = role !== "未登入";

  // 根據角色獲取對應內容
  const currentRoleContent = roleSpecificContent[role as keyof typeof roleSpecificContent] ||
    roleSpecificContent["未登入"];

  // 卡片點擊事件處理
  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, href: string) => {
    if (!href) return; // 如果沒有href，不做任何操作

    if (!isLoggedIn) {
      e.preventDefault();
      e.stopPropagation();
      router.push("/login");
    } else {
      router.push(href);
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center">
        <div className="inline-block text-center justify-center">
          <h1 className={title()}>逢甲大學經濟學課程智能TA</h1>
        </div>
      </section>

      {/* 動態顯示針對當前角色的歡迎訊息 */}
      <section className="flex flex-col items-center justify-center p-4">
        <div className="inline-block text-center justify-center w-full">
          {isLoggedIn && (
            <h2 className="text-xl font-medium mb-2 text-center">
              {`歡迎，${role}${userInfo?.studentId ? ` (${userInfo.studentId})` : ''}`}
            </h2>
          )}
          <h2 className="text-2xl font-bold mb-2 text-center">{currentRoleContent.title}</h2>
          <p className="text-lg text-center">{currentRoleContent.description}</p>
        </div>
      </section>

      {/* 功能卡片 - 適用於所有已登入角色 */}
      {isLoggedIn && currentRoleContent.features && currentRoleContent.features.length > 0 && (
        <section className="items-center justify-center p-8">
          <h2 className="text-xl font-bold mb-6 text-center">
            {role === "學生" ? "學習資源" : "管理功能"}
          </h2>
          <div className={`grid gap-4 grid-cols-1 ${role === "學生"
            ? "md:grid-cols-2 lg:grid-cols-4"
            : role === "助教"
              ? "md:grid-cols-2"
              : "md:grid-cols-3"
            } max-w-6xl mx-auto`}>
            {currentRoleContent.features.map((feature) => (
              <Card
                key={feature.href}
                isPressable
                onClick={() => router.push(feature.href)}
                className="shadow-lg hover:shadow-xl transition-all duration-300 border-0"
              >
                <div className={`${feature.color} h-2 w-full`}></div>
                <CardBody className="p-6">
                  <div className="text-center mb-4">
                    <div className={`text-4xl inline-block p-4 rounded-full text-center`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-center mb-2">{feature.title}</h3>
                  <p className="text-center">{feature.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 如果未登入，顯示登入提示區域 */}
      {!isLoggedIn && (
        <section className="items-center justify-center pb-8">
          <div className="text-center p-10 rounded-xl shadow-md border">
            <h3 className="text-2xl font-bold mb-6">請登入或註冊以使用系統功能</h3>
            <p className="mb-8 text-lg mx-auto max-w-2xl">
              登入或註冊後，您將可以使用經濟學課程智能TA的所有功能。
            </p>

            <div className="flex justify-center space-x-8">
              <Button
                color="primary"
                variant="shadow"
                size="lg"
                as={NextLink}
                href="/login"
                className="text-lg font-semibold px-10 py-6 "
              >
                登入系統
              </Button>
              <Button
                color="secondary"
                variant="shadow"
                size="lg"
                as={NextLink}
                href="/register"
                className="text-lg font-semibold px-10 py-6 "
              >
                註冊帳號
              </Button>
            </div>
          </div>
        </section>
      )}
    </DefaultLayout>
  );
}