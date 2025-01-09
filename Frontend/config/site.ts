export type SiteConfig = typeof siteConfig

export const siteConfig = {
    name: "經濟學課程智能TA",
    api_url: process.env.NEXT_PUBLIC_API_URL,
    language: "zh",
    description:
        "歡迎來到經濟學課程智能TA的專屬頁面，在這裡，無論你有關於經濟學理論、數據分析、作業輔導，還是任何其他相關問題，我都樂意提供幫助。",
    navItems: [
        {
            label: "文檔",
            href: "/docs",
        },
        {
            label: "問答",
            href: "/chat",
        },
    ],
    links: {
        github: "https://github.com/LostALice",
    },
    mainPageItems: [
        {
            href: "/docs",
            title: "文檔",
            descriptions: "閱讀文檔",
            image: "https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg",
            alt: "docs",
        },
        {
            href: "/chat",
            title: "問答",
            descriptions: "開始對話",
            image: "https://images.pexels.com/photos/374720/pexels-photo-374720.jpeg",
            alt: "chat",
        },
    ],
}
