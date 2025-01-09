// Code by AkinoAlice@TyrantRey

import { useState } from "react";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem
} from "@nextui-org/dropdown";
import { Button } from "@nextui-org/button";
import { siteConfig } from "@/config/site";

export const LangSwitch = () => {
    const [language, setLanguage] = useState<string>(siteConfig.language)

    function displayLanguage(language: string) {
        switch (language) {
            case "en":
                return "English";
            case "zh":
                return "中文";
            default:
                return "English";
        }
    }

    return (
        <div className="flex items-center space-x-2">
            <Dropdown>
                <DropdownTrigger>
                    <Button
                        size="sm"
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
                        const selectedLanguage = Array.from(keys)[0] as string;
                        setLanguage(selectedLanguage);
                    }}
                >
                    <DropdownItem key="en">English</DropdownItem>
                    <DropdownItem key="zh">中文</DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </div >
    );
}