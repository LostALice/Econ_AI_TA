export type SiteConfig = typeof siteConfig


export const siteConfig = {
    name: "逢甲大學選課問答機械人",
    api_url: process.env.NEXT_PUBLIC_API_URL,
    description:
        "逢甲大學課程問答機械人，在這裡，您可以即時獲得有關課程的所有問題的答案。不論是關於課程表、學分還是其他任何問題。",
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
        github: "https://github.com/LostALics",
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
