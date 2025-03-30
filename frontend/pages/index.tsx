import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default"
import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

import NextLink from "next/link";

import { Card, CardBody } from "@nextui-org/card";
import { Image } from "@nextui-org/image";
import { Button } from "@nextui-org/react";

// 更新不同身份對應的內容，僅保留課程資源
const roleSpecificContent = {
  "學生": {
    title: "學生學習中心",
    description: "歡迎來到經濟學課程智能TA的專屬頁面，在這裡，無論你有關於經濟學理論、數據分析、作業輔導，還是任何其他相關問題，我都樂意提供幫助。",
    courses: [
      {
        href: "/courses/principles",
        title: "大一經濟學原理",
        descriptions: "基礎經濟學概念與理論",
        image: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg",
        alt: "經濟學原理課程",
      },
      {
        href: "/courses/civil-service",
        title: "公務員高普考課程",
        descriptions: "考試準備資源與練習題",
        image: "https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg",
        alt: "高普考課程",
      }
    ]
  },
  "教師": {
    title: "教師管理平台",
    description: "管理課程內容、查看學生進度並創建評估材料",
    courses: [
      {
        href: "/courses/principles",
        title: "大一經濟學原理",
        descriptions: "課程管理與教學資源",
        image: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg",
        alt: "經濟學原理課程",
      },
      {
        href: "/courses/civil-service",
        title: "公務員高普考課程",
        descriptions: "考試內容管理與統計",
        image: "https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg",
        alt: "高普考課程",
      }
    ]
  },
  "助教": {
    title: "助教支援系統",
    description: "協助管理課程、回答學生問題並提供學習支援",
    courses: [
      {
        href: "/courses/principles",
        title: "大一經濟學原理",
        descriptions: "教學輔助與學生諮詢",
        image: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg",
        alt: "經濟學原理課程",
      },
      {
        href: "/courses/civil-service",
        title: "公務員高普考課程",
        descriptions: "考試輔導與資源整理",
        image: "https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg",
        alt: "高普考課程",
      }
    ]
  },
  "未登入": {
    title: "經濟學課程資源",
    description: "請登入以使用完整功能",
    courses: [
      {
        href: "/courses/principles",
        title: "大一經濟學原理",
        descriptions: "經濟學基礎概念與理論",
        image: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg",
        alt: "經濟學原理課程",
      },
      {
        href: "/courses/civil-service",
        title: "公務員高普考課程",
        descriptions: "考試資源與準備指南",
        image: "https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg",
        alt: "高普考課程",
      }
    ]
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
        <div className="inline-block text-center justify-center w-full">  {/* 修正這行 */}
          {isLoggedIn && (
            <h2 className="text-xl font-medium text-blue-600 dark:text-blue-400 mb-2 text-center">  {/* 添加 text-center */}
              {`歡迎，${role}${userInfo?.studentId ? ` (${userInfo.studentId})` : ''}`}
            </h2>
          )}
          <h2 className="text-2xl font-bold mb-2 text-center">{currentRoleContent.title}</h2>  {/* 添加 text-center */}
          <p className="text-lg text-center">{currentRoleContent.description}</p>  {/* 添加 text-center */}
        </div>
      </section>
      
      {/* 課程資源卡片 */}
      <section className="items-center justify-center p-8">
        <h2 className="text-xl font-bold mb-6 text-center">課程資源</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {currentRoleContent.courses.map((course) => (
            <div 
              key={course.href}
              onClick={(e) => handleCardClick(e, course.href)}
              className="relative cursor-pointer"
            >
              <Card
                shadow="md"
                isPressable={true}
                className="flex-1 w-full md:h-auto rounded-xl font-sans text-white dark:text-slate-300"
              >
                <div className="h-full hover:scale-105 hover:transform duration-300">
                  <CardBody className="absolute h-full z-10 flex-col justify-center items-center p-0 brightness-[1]">
                    <span className="font-bold text-2xl md:text-3xl text-center bg-transparent">
                      {course.title}
                    </span>
                    <span className="text-center p-1">{course.descriptions}</span>
                  </CardBody>
                  <Image
                    removeWrapper={true}
                    className="z-0 h-full object-cover"
                    src={course.image}
                    alt={course.alt}
                  />
                </div>
              </Card>
              
              {/* 未登入時顯示鎖定覆蓋層 */}
              {!isLoggedIn && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center rounded-xl">
                  <div className="text-white text-3xl mb-2">🔒</div>
                  <p className="text-white font-semibold text-lg">需要登入</p>
                  <Button
                    color="primary"
                    size="sm"
                    className="mt-3"
                    as={NextLink}
                    href="/login"
                  >
                    登入以使用
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      
      {/* 如果未登入，顯示登入提示區域 */}
      {!isLoggedIn && (
        <section className="items-center justify-center pb-8">
          <div className="text-center bg-blue-50 dark:bg-slate-700 p-10 rounded-xl shadow-md border border-blue-100 dark:border-slate-600">
            <h3 className="text-2xl font-bold mb-6 text-blue-800 dark:text-blue-200">請登入或註冊以使用系統功能</h3>
            <p className="mb-8 text-lg text-gray-700 dark:text-gray-200 mx-auto max-w-2xl">
              登入或註冊後，您將可以使用經濟學課程智能TA的所有功能，包括大一經濟學原理和公務員高普考課程資源。
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