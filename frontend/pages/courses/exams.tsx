// 線上測驗選擇頁面 - 路徑: /courses/exams
// filepath: c:\Users\asus\Desktop\經濟腦TA\Econ_AFS\frontend\pages\courses\exams.tsx

import { useState } from "react";
import { Card, CardBody, Checkbox, Button, Divider } from "@heroui/react";
import DefaultLayout from "@/layouts/default";

export default function Exams() {
  // 改用對象存儲多選狀態
  const [selectedCourses, setSelectedCourses] = useState({
    principles: true,
    civilService: false
  });

  const handleCourseChange = (course: string) => {
    setSelectedCourses({
      ...selectedCourses,
      [course]: !selectedCourses[course as keyof typeof selectedCourses]
    });
  };

  const handleSubmit = () => {
    // 根據選擇的課程生成URL參數
    const params = new URLSearchParams();
    
    if (selectedCourses.principles) {
      params.append("course", "principles");
    }
    
    if (selectedCourses.civilService) {
      params.append("course", "civil-service");
    }
    
    // 重定向到測驗頁面，並帶上選擇的課程參數
    window.location.href = `/courses/exams/start?${params.toString()}`;
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">線上測驗</h1>
        
        <Card className="max-w-md mx-auto">
          <CardBody className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold">請選擇測驗課程</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  您可以選擇一個或多個課程進行測驗評估
                </p>
              </div>
              
              <Divider />
              
              <div className="flex flex-col space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <Checkbox
                    isSelected={selectedCourses.principles}
                    onChange={() => handleCourseChange("principles")}
                    size="lg"
                    color="primary"
                    className="w-full"
                  >
                    <div className="ml-2">
                      <span className="text-lg font-medium text-blue-800 dark:text-blue-200">大一經濟學原理</span>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">基礎經濟學概念與理論測驗</p>
                    </div>
                  </Checkbox>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <Checkbox
                    isSelected={selectedCourses.civilService}
                    onChange={() => handleCourseChange("civilService")}
                    size="lg"
                    color="secondary"
                    className="w-full"
                  >
                    <div className="ml-2">
                      <span className="text-lg font-medium text-purple-800 dark:text-purple-200">公務員高普考課程</span>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">公職考試準備測驗</p>
                    </div>
                  </Checkbox>
                </div>
              </div>
              
              <Button
                color="primary"
                size="lg"
                className="w-full mt-6"
                onClick={handleSubmit}
                disabled={!selectedCourses.principles && !selectedCourses.civilService}
              >
                開始測驗
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </DefaultLayout>
  );
}