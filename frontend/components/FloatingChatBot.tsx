import { useState, useEffect, useRef, useContext } from "react";
import { Button, Card, CardBody, CardFooter, CardHeader, Input, Avatar, Tooltip, Popover, PopoverTrigger, PopoverContent } from "@nextui-org/react";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

interface Message {
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { role } = useContext(AuthContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isStudent = role === "學生";
  const router = useRouter();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        const formattedMessages = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(formattedMessages);
      } catch (error) {
        console.error("無法解析儲存的對話歷史:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const userMessage: Message = {
      content: message,
      sender: "user",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage("");
    setIsTyping(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const botResponses: { [key: string]: string } = {
        "你好": "你好！我是智能 TA，有什麼經濟學問題需要幫助嗎？",
        "幫助": "我可以回答經濟學原理問題、解釋經濟學概念、協助解決作業問題等。請直接問我問題吧！",
        "謝謝": "不用謝！如果還有其他問題，隨時可以問我。",
      };
      
      let botResponse = "我是智能 TA，有什麼經濟學相關的問題需要幫助嗎？如果是課程問題，我會盡力解答。";
      
      const economicsKeywords = ["供需", "均衡", "彈性", "gdp", "通膨", "市場", "壟斷", "競爭", "價格"];
      for (const keyword of economicsKeywords) {
        if (message.toLowerCase().includes(keyword)) {
          botResponse = `關於${keyword}的問題，這是經濟學中的重要概念。我可以幫你解釋或提供相關資料。請告訴我你具體想了解什麼？`;
          break;
        }
      }
      
      const botMessage: Message = {
        content: botResponse,
        sender: "bot",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("發送訊息時發生錯誤:", error);
      
      const errorMessage: Message = {
        content: "抱歉，發生了錯誤。請稍後再試。",
        sender: "bot",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  };

  const navigateToChat = () => {
    router.push("/courses/chat");
  };

  const handleCardClick = () => {
    if (isOpen) {
      navigateToChat();
    } else {
      setIsOpen(true);
      setTimeout(() => setIsOpen(false), 3000);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateToChat();
  };

  return (
    <>
      {isStudent && (
        <div className="fixed bottom-6 right-6 z-50">
          <Popover 
            placement="top" 
            isOpen={isPopoverOpen} 
            onOpenChange={setIsPopoverOpen}
          >
            <PopoverTrigger>
              <Button
                isIconOnly
                radius="full"
                size="lg"
                className="bg-green-500 text-white shadow-lg hover:bg-green-600 transition-transform hover:scale-105"
              >
                <span className="text-2xl">💬</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="px-4 py-3 bg-green-500 text-white border-none">
              <div className="text-center">
                <h4 className="font-bold text-lg mb-1">智能 TA 助手</h4>
                <p className="text-sm">
                  點擊開始與智能 TA 對話，獲取經濟學學習指導。
                </p>
                <Button 
                  className="w-full mt-3 bg-white text-green-500 font-medium"
                  size="sm"
                  onClick={navigateToChat}
                >
                  開始對話
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* 懸浮提示 - 當彈出框未打開時顯示 */}
          {!isPopoverOpen && (
            <Tooltip 
              content="智能 TA 助手" 
              placement="left"
              delay={500}
              closeDelay={0}
            >
              <span></span> {/* 空元素用於工具提示定位 */}
            </Tooltip>
          )}
        </div>
      )}
    </>
  );
}