// Code by AkinoAlice@TyrantRey

import { useContext } from "react";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem
} from "@nextui-org/dropdown";

import { LangContext } from "@/contexts/LangContext";
import { TLanguage } from "@/types/contexts/types";
import { Button } from "@nextui-org/button";

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