// Code by AkinoAlice@TyrantRey

import { useState, useEffect, useContext } from "react";
import { LangContext } from "@/contexts/LangContext"
import { LanguageTable } from "@/i18n"

export const Timer = ({ duration, onTimeUp }: { duration: number, onTimeUp: () => void }) => {
    const { language, setLang } = useContext(LangContext)
    const [timeLeft, setTimeLeft] = useState(duration * 60);

    useEffect(() => {
        if (timeLeft <= 0) {
            if (onTimeUp) {
                onTimeUp()
            };
            return;
        }
        const timerId = setTimeout(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearTimeout(timerId);
    }, [timeLeft, onTimeUp]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
        <div className="fixed bottom-5 right-5">
            <div className="p-4 rounded-lg shadow-lg text-center">
                <span className="text-xl font-bold mb-2">{LanguageTable.mock.mock.timeLeft[language]}</span>
                <div className="text-3xl">
                    {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </div>
            </div>
        </div>
    );
};