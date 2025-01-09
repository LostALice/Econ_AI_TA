import { Navbar } from "@/components/navbar/navbar";
import { Link } from "@nextui-org/link";
import { Head } from "./head";

import Transition from "@/components/transition/transition";

export default function DefaultLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative flex flex-col h-screen">
			<Head />
			<Navbar />
			<main className="h-screen md:h-[90svh] container mx-auto max-w-7xl px-3 flex-grow">
				<Transition>
					{children}
				</Transition>
			</main>
			<footer className="h-[5svh] w-full flex items-center justify-center overflow-hidden">
				<Link
					isExternal
					className="flex items-center gap-1 text-current px-3"
					href="https://github.com/LostALice"
					title="Do you know the magic?"
				>
					<span className="italic text-small">Copyright © Aki.no.Alice@TyrantRey 張紹謙 2022-2026</span>
				</Link>
			</footer>
		</div>
	);
}
