// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default";
import { useContext } from "react";
import { LangContext } from "@/contexts/LangContext";

import {
    Button,
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    useDisclosure
} from "@heroui/react";


export default function MockPage() {
    const { language, setLang } = useContext(LangContext);

    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    return (
        <DefaultLayout>
            <Button onPress={onOpen}>Open Drawer</Button>
            <Drawer isOpen={isOpen} placement="left" onOpenChange={onOpenChange}>
                <DrawerContent>
                    {(onClose) => (
                        <>
                            <DrawerHeader className="flex flex-col gap-1">Drawer Title</DrawerHeader>
                            <DrawerBody>
                                asd
                            </DrawerBody>
                            <DrawerFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Close
                                </Button>
                                <Button color="primary" onPress={onClose}>
                                    Action
                                </Button>
                            </DrawerFooter>
                        </>
                    )}
                </DrawerContent>
            </Drawer>
        </DefaultLayout>
    )
}