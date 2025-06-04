export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "經濟學課程智能TA",
  api_url: process.env.NEXT_PUBLIC_API_URL,
  description:
    "歡迎來到經濟學課程智能TA的專屬頁面，在這裡，無論你有關於經濟學理論、數據分析、作業輔導，還是任何其他相關問題，我都樂意提供幫助。",
  navItems: [
    {
      label: "docs",
      href: "/docs",
    },
    {
      label: "chat",
      href: "/chatroom",
    },
    {
      label: "mock",
      href: "/mock",
    },
  ],
  links: {
    github: "https://github.com/LostALice",
  },
  mainPageItems: [
    {
      href: "/docs",
      title: {
        zh: "題庫",
        en: "Docs",
      },
      description: {
        zh: "考古題題庫",
        en: "Read the documentation",
      },
      image:
        "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg",
      alt: "docs",
    },
    {
      href: "/chatroom",
      title: {
        zh: "問答",
        en: "Chat",
      },
      description: {
        zh: "開始對話",
        en: "Start chatting",
      },
      image: "https://images.pexels.com/photos/374720/pexels-photo-374720.jpeg",
      alt: "chat",
    },
  ],
};
