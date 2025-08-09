import { Navbar } from "@/components/navbar/navbar";
import { Head } from "./head";

import Transition from "@/components/transition/transition";
import ToastMessageProvider from "@/contexts/ToastContextProvider";

export default function DefaultLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	console.log(
		"%c\n\nDo you know the magic?",
		"color:red; font-size: 64px font-weight: bold",
		"\n\nhttps://github.com/LostALice/Econ_AI_TA",
		"\n\nCopyright © Aki.no.Alice@TyrantRey 2022-2026"
	)
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
		</div>
	);
}
