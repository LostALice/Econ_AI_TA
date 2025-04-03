import { Navbar } from "@/components/navbar";
import { Link } from "@heroui/link";
import { Head } from "./head";
import FloatingChatBot from "@/components/FloatingChatBot";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col min-h-screen">
      <Head />
      <Navbar />
      <main className="container mx-auto max-w-7xl pt-16 flex-grow px-6">
        {children}
      </main>
      <footer className="w-full flex items-center justify-center py-3 bg-white/50 backdrop-blur-md dark:bg-black/50">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://www.fcu.edu.tw/"
          title="逢甲大學"
        >
          <span className="text-default-600">© 2025 逢甲大學經濟學課程智能TA</span>
        </Link>
      </footer>
      
      {/* 添加浮動聊天機器人 */}
      <FloatingChatBot />
    </div>
  );
}
