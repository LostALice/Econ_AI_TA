import { Navbar } from "@/components/navbar/navbar";
import { Link } from "@heroui/link";
import { Head } from "./head";

import Transition from "@/components/transition/transition";
import ToastMessageProvider from "@/contexts/ToastContextProvider";

export default function DefaultLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// console.log(
	// 	"%c\n\nDo you know the magic?",
	// 	"color:red; font-size: 64px font-weight: bold",
	// 	"\n\nhttps://github.com/LostALice/Econ_AI_TA",
	// 	"\n\nCopyright © Aki.no.Alice@TyrantRey 2022-2026"
	// )
	return (
		<div className="relative flex flex-col h-screen">
			<Head />
			<Navbar />
			<main className="h-screen md:h-[90vh] container mx-auto max-w-7xl px-3 flex-grow">
				<ToastMessageProvider>
					<Transition>
						{children}
					</Transition>
				</ToastMessageProvider>
			</main>
			{/* <footer className="h-16 w-full flex items-center justify-center pt-3">
				<Link
					isExternal
					className="flex items-center gap-1 text-current px-3"
					href="https://github.com/LostALice/FCU_Econ_TA"
					title="Do you know the magic?"
				>
					<span className="italic text-small">Copyright © Aki.no.Alice@TyrantRey 2022-2026</span>
				</Link>
			</footer> */}
		</div>
	);
}
