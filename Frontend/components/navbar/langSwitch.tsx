// Code by AkinoAlice@TyrantRey

import { useContext } from "react";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button
} from "@heroui/react";

import { LangContext } from "@/contexts/LangContext";
import { TLanguage } from "@/types/contexts/types";

export const LangSwitch = () => {
    const { language, setLang } = useContext(LangContext);

    function displayLanguage(language: TLanguage) {
        switch (language) {
            case "en":
                return "English";
            case "zh":
                return "中文";
            default:
                return "中文";
        }
    }

    return (
        <div className="flex items-center">
            <Dropdown>
                <DropdownTrigger>
                    <Button
                        className="border bg-transparent text-medium border-none"
                    >
                        {displayLanguage(language)}
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Select Language"
                    disallowEmptySelection
                    selectionMode="single"
                    selectedKeys={language}
                    onSelectionChange={(keys) => {
                        setLang(keys.currentKey?.toString() as TLanguage);
                    }}
                >
                    <DropdownItem key="en">English</DropdownItem>
                    <DropdownItem key="zh">中文</DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </div >
    );
}