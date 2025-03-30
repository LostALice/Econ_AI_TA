import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default"
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

import NextLink from "next/link";

import { Card, CardBody } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { Button } from "@nextui-org/react";

// 更新教師身份的內容，將功能整合為三個直接入口
type RoleContent = {
  title: string;
  description: string;
  courses: any[];
  features?: {
    href: string;
    title: string;
    description: string;
    icon: string;
    color: string;
  }[];
}

const roleSpecificContent: Record<string, RoleContent> = {
  "未登入": {
    title: "經濟學課程智能TA",
    description: "登入後體驗完整功能，獲取專業的經濟學學習資源和指導。",
    courses: []
  },
  "學生": {
    // 學生部分保持不變
    title: "學生學習中心",
    description: "歡迎來到經濟學課程智能TA的專屬頁面，在這裡，無論你有關於經濟學理論、數據分析、作業輔導，還是任何其他相關問題，我都樂意提供幫助。",
    courses: [
      {
        href: "",
        title: "大一經濟學原理",
        descriptions: "基礎經濟學概念與理論",
        image: "",
        alt: "經濟學原理課程",
        subFeatures: [
          // 學生的子功能保持不變
          {
            href: "/courses/principles/question-bank",
            title: "題庫",
            description: "練習各章節習題",
            icon: "📚"
          },
          {
            href: "/courses/principles/exams",
            title: "線上測驗",
            description: "參與模擬考試",
            icon: "📝"
          },
          {
            href: "/courses/principles/chat",
            title: "智能TA對話",
            description: "獲得即時解答",
            icon: "💬"
          },
          {
            href: "/courses/principles/records",
            title: "學習紀錄",
            description: "查看學習進度",
            icon: "📊"
          }
        ]
      },
      {
        href: "",
        title: "公務員高普考課程",
        descriptions: "考試準備資源與練習題",
        image: "",
        alt: "高普考課程",
        subFeatures: [
          // 學生的子功能保持不變
          {
            href: "/courses/civil-service/question-bank",
            title: "題庫",
            description: "高普考專屬練習題",
            icon: "📚"
          },
          {
            href: "/courses/principles/exams",
            title: "線上測驗",
            description: "參與模擬考試",
            icon: "📝"
          },
          {
            href: "/courses/principles/chat",
            title: "智能TA對話",
            description: "獲得即時解答",
            icon: "💬"
          },
          {
            href: "/courses/principles/records",
            title: "學習紀錄",
            description: "查看學習進度",
            icon: "📊"
          }
        ]
      }
    ]
  },
  "教師": {
    title: "教師管理平台",
    description: "管理課程內容、查看學生進度與題庫上傳",
    // 移除課程分類，直接提供三個功能入口
    features: [
      {
        href: "/courses/principles/question-bank",
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
    courses: [] // 教師不再顯示課程卡片
  },
  "助教": {
    title: "助教支援系統",
    description: "協助管理課程、回答學生問題並提供學習支援",
    // 為助教添加功能卡片，類似於教師的布局
    features: [
      {
        href: "/ta/question-bank",
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
    courses: [] // 助教不再顯示課程卡片
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
            <h2 className="text-xl font-medium text-blue-600 dark:text-blue-400 mb-2 text-center">
              {`歡迎，${role}${userInfo?.studentId ? ` (${userInfo.studentId})` : ''}`}
            </h2>
          )}
          <h2 className="text-2xl font-bold mb-2 text-center">{currentRoleContent.title}</h2>
          <p className="text-lg text-center">{currentRoleContent.description}</p>
        </div>
      </section>
      
      {/* 教師/助教專用功能卡片 */}
      {isLoggedIn && (role === "教師" || role === "助教") && currentRoleContent.features && (
        <section className="items-center justify-center p-8">
          <h2 className="text-xl font-bold mb-6 text-center">管理功能</h2>
          <div className={`grid gap-4 grid-cols-1 ${role === "助教" ? "md:grid-cols-2" : "md:grid-cols-3"} max-w-5xl mx-auto`}>
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
                    <div className={`text-4xl inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-800 text-center`}>
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="font-bold text-xl text-center mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center">{feature.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      )}
      
      {/* 課程資源卡片 - 只為學生顯示 */}
      {isLoggedIn && role === "學生" && currentRoleContent.courses && currentRoleContent.courses.length > 0 && (
        <section className="items-center justify-center p-8">
          <h2 className="text-xl font-bold mb-6 text-center">課程資源</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {currentRoleContent.courses.map((course) => (
              <div 
                key={course.title}
                className="relative"
              >
                {/* 主課程卡片 - 學生視角 */}
                <Card className="flex-1 w-full rounded-xl shadow-md">
                  <div className={`bg-gradient-to-r ${
                    course.title === "大一經濟學原理" 
                      ? "from-blue-500 to-blue-700" 
                      : "from-purple-500 to-purple-700"
                  } p-6 rounded-t-xl`}>
                    <div className="text-center">
                      <h3 className="font-bold text-2xl md:text-3xl text-white mb-2">
                        {course.title}
                      </h3>
                      <p className="text-white text-lg">{course.descriptions}</p>
                    </div>
                  </div>
                </Card>
                
                {/* 子功能卡片 - 學生視角 */}
                {course.subFeatures && course.subFeatures.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.subFeatures.map((feature: {
                      href: string;
                      title: string;
                      description: string;
                      icon: string;
                    }) => (
                      <Card
                        key={feature.href}
                        isPressable
                        onClick={() => router.push(feature.href)}
                        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-shadow"
                      >
                        <CardBody className="p-4">
                          <div className="flex items-center mb-2">
                            <div className={`text-2xl ${
                              course.title === "大一經濟學原理"
                                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                : "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                            } p-2 rounded-full mr-3`}>
                              {feature.icon}
                            </div>
                            <h3 className={`font-bold text-lg ${
                              course.title === "大一經濟學原理"
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-purple-700 dark:text-purple-300"
                            }`}>
                              {feature.title}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-800 dark:text-gray-200 pl-12">
                            {feature.description}
                          </p>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* 如果未登入，顯示登入提示區域 */}
      {!isLoggedIn && (
        <section className="items-center justify-center pb-8">
          <div className="text-center bg-blue-50 dark:bg-slate-700 p-10 rounded-xl shadow-md border border-blue-100 dark:border-slate-600">
            <h3 className="text-2xl font-bold mb-6 text-blue-800 dark:text-blue-200">請登入或註冊以使用系統功能</h3>
            <p className="mb-8 text-lg text-gray-700 dark:text-gray-200 mx-auto max-w-2xl">
              登入或註冊後，您將可以使用經濟學課程智能TA的所有功能。
            </p>
            
            <div className="flex justify-center space-x-8">
              <Button 
                color="primary" 
                variant="shadow"
                size="lg"
                as={NextLink} 
                href="/login"
                className="text-lg font-semibold px-10 py-6 bg-blue-600 hover:bg-blue-700"
              >
                登入系統
              </Button>
              <Button 
                color="secondary" 
                variant="shadow" 
                size="lg"
                as={NextLink} 
                href="/register"
                className="text-lg font-semibold px-10 py-6 bg-purple-600 hover:bg-purple-700 text-white"
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