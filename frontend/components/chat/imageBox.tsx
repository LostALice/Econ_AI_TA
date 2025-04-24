import { FC, useState } from "react";
import { IImage } from "@/types/chat/types";
import { Image } from "@heroui/react";

export const ImageBox: FC<IImage> = ({ base64Image, onClose }) => {
    const [isEnlarged, setIsEnlarged] = useState(false);

    // Handler to open the enlarged image modal
    const handleImageClick = () => {
        setIsEnlarged(true);
    };

    // Handler to close the enlarged image modal
    const handleEnlargedClose = () => {
        setIsEnlarged(false);
    };

    return (
        <>
            <div className="relative inline-block pr-3">
                <Image
                    src={`data:image/png;base64,${base64Image}`}
                    alt="Image"
                    width={128}
                    height={128}
                    className="rounded shadow-md object-fill cursor-pointer"
                    onClick={handleImageClick}
                />
                <button
                    color="primary"
                    className="absolute -top-2 -right-1 border-0.5 text-text-500 bg-bg-000 hover:text-danger-500 -translate-x-1/2 -translate-y-1/2 rounded-full p-1 transition hover:scale-105"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                    >
                        <path d="M208.49,191.51a12,12,0,0,1-17,17L128,145,64.49,208.49a12,12,0,0,1-17-17L111,128,47.51,64.49a12,12,0,0,1,17-17L128,111l63.51-63.52a12,12,0,0,1,17,17L145,128Z"></path>
                    </svg>
                </button>
            </div>
            {isEnlarged && (
                <div
                    className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
                    onClick={handleEnlargedClose}
                >
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <Image
                            src={`data:image/png;base64,${base64Image}`}
                            alt="Enlarged Image"
                            className="rounded shadow-lg"
                        />
                    </div>
                </div>
            )}
        </>
    );
};
