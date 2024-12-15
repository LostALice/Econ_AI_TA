import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default"
import { siteConfig } from "@/config/site";

import NextLink from "next/link";

import { Card, CardBody } from "@nextui-org/card";
import { Image } from "@nextui-org/image";

export default function MainPage() {
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center">
        <div className="inline-block text-center justify-center">
          <h1 className={title()}>逢甲大學經濟學課程智能TA</h1>
        </div>
      </section>
      <section className="flex flex-col items-center justify-center p-4">
        <div className="inline-block text-center justify-center">
          <h2>歡迎來到經濟學課程智能TA的專屬頁面！</h2>
          <h2>
            在這裡，無論你有關於經濟學理論、數據分析、作業輔導，還是任何其他相關問題，我都樂意提供幫助。
          </h2>
        </div>
      </section>
      <section className="items-center justify-center p-8 ">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {siteConfig.mainPageItems.map((item) => (
            <Card
              shadow="md"
              isPressable={true}
              className="flex-1 w-full md:h-auto rounded-xl font-sans text-white dark:text-slate-300"
              key={item.href}
            >
              <div className="h-full hover:scale-110 hover:transform duration-300">
                <NextLink color="foreground" href={item.href}>
                  <CardBody className="absolute h-full z-10 flex-col justify-center items-center p-0 brightness-[1]">
                    <span className="font-bold text-2xl md:text-3xl text-center bg-transparent">
                      {item.title}
                    </span>
                    <span className="text-center p-1">{item.descriptions}</span>
                  </CardBody>
                </NextLink>
                <Image
                  removeWrapper={true}
                  className="z-0 h-full object-cover"
                  src={item.image}
                  alt={item.alt}
                />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </DefaultLayout>
  );
}
