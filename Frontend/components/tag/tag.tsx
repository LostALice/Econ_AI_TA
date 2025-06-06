// Code by AkinoAlice@TyrantRey

import { useState, useEffect, useContext, Key } from "react";
import { LangContext } from "@/contexts/LangContext"
import { LanguageTable } from "@/i18n"

import {
    fetchTagList,
    fetchQuestionTag,
    createTag,
    removeTag,
    addQuestionTag,
    removeQuestionTag
} from "@/api/tag/tag"
import { TagModel } from "@/types/tag/tag"

import {
    Select,
    SelectItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    ButtonGroup,
    useDisclosure,
    Input,
    addToast,
    Tabs,
    Tab,
    Chip,
    ScrollShadow,
    Dropdown,
    DropdownItem,
    DropdownTrigger,
    DropdownMenu
} from "@heroui/react"

export const TagBox = ({ questionId = null }: { questionId?: number | null }) => {
    const { language, setLang } = useContext(LangContext)
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const [tagList, setTagList] = useState<TagModel[]>([])
    const [questionOwnedTagList, setQuestionOwnedTagList] = useState<TagModel[]>()
    const [currentSelectedTag, setCurrentSelectedTag] = useState<Set<string>>()

    const [tagToDelete, setTagToDelete] = useState<Set<number>>()

    const [tagName, setTagName] = useState<string>("")
    const [tagDescription, setTagDescription] = useState<string>("")

    useEffect(() => {
        const setup = async () => {
            const tagsList = await fetchTagList()
            console.log(tagsList)
            setTagList(tagsList)

            if (questionId != null) {
                const questionTagList = await fetchQuestionTag(questionId)
                console.log(questionTagList)
                setQuestionOwnedTagList(questionTagList)
            }
        }
        setup()
    }, [questionId]);

    const handleUpdateTagList = async () => {
        if (questionId == null || questionId == undefined) return
        const questionTagList = await fetchQuestionTag(questionId)
        console.log(questionTagList)
        setQuestionOwnedTagList(questionTagList)
    }

    const handleCreateTag = async (tag_name: string, tag_description: string) => {
        if (tag_name == "" || tag_description == "") {
            addToast({
                title: LanguageTable.mock.tag.cantBeNone[language],
                color: "warning",
            })
            return
        }
        try {
            const success = await createTag(tag_name, tag_description)
            if (success) {
                addToast({
                    title: LanguageTable.mock.tag.createdTag[language],
                    color: "success",
                })
                handleUpdateTagList()
            } else {
                addToast({
                    title: LanguageTable.mock.tag.failedCreateTag[language],
                    color: "warning",
                })
            }

        }
        catch (error) {
            console.error(error)
        }
    }
    const handleRemoveTag = async (tag_id: number) => {
        try {
            const success = await removeTag(tag_id)
            if (success) {
                addToast({
                    title: LanguageTable.mock.tag.removedTag[language],
                    color: "success",
                })
            } else {
                addToast({
                    title: LanguageTable.mock.tag.failedRemoveTag[language],
                    color: "warning",
                })
            }
        }
        catch (error) {
            console.error(error)
        }
    }

    const handleAddQuestionTag = async (question_id: number, tag_id: number) => {
        try {
            const success = await addQuestionTag(question_id, tag_id)
            if (success) {
                addToast({
                    title: LanguageTable.mock.tag.addedTag[language],
                    color: "success",
                })
            } else {
                addToast({
                    title: LanguageTable.mock.tag.failedAddTag[language],
                    color: "warning",
                })
            }
        }
        catch (error) {
            console.error(error)
        }
        handleUpdateTagList()
    }
    const handleRemoveQuestionTag = async (question_id: number, tag_id: number) => {
        try {
            const success = await removeQuestionTag(question_id, tag_id)
            if (success) {
                addToast({
                    title: LanguageTable.mock.tag.removedTag[language],
                    color: "success",
                })
            } else {
                addToast({
                    title: LanguageTable.mock.tag.failedRemoveTag[language],
                    color: "warning",
                })
            }
        }
        catch (error) {
            console.error(error)
        }
        handleUpdateTagList()
    }

    const handleOnTagSelected = async (tagId: Key) => {
        if (questionOwnedTagList == undefined) return
        if (questionId == undefined || questionId == null) return
        if (questionOwnedTagList.find(tag => tag.tag_id == tagId)) {
            addToast({
                title: LanguageTable.mock.tag.tagAlreadyAdded[language],
                color: "warning"
            })
            return
        }
        handleAddQuestionTag(questionId, Number(tagId))
    }

    const handleOnDeleteTags = async () => {
        if (tagToDelete == null || undefined) return
        for (const tagId of tagToDelete) {
            try {
                const success = await handleRemoveTag(tagId)
                console.log(tagId, success)
            }
            catch (error) {
                console.log(error)
            }
        }
        handleUpdateTagList()
    }
    return (
        <div className="flex flex-col gap-1">
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">{LanguageTable.mock.tag.addOrRemoveTag[language]}</ModalHeader>
                            <ModalBody>
                                <Tabs aria-label="Options">
                                    <Tab key="add" title="Add">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-row gap-3">
                                                <Input label="Tag Name" value={tagName} onValueChange={setTagName}></Input>
                                                <Input label="Tag Description" value={tagDescription} onValueChange={setTagDescription}></Input>
                                            </div>
                                            <div className="flex justify-center">
                                                <Button onPress={() => handleCreateTag(tagName, tagDescription)}>{LanguageTable.mock.tag.submit[language]}</Button>
                                            </div>
                                        </div>
                                    </Tab>
                                    <Tab key="remove" title="remove">
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-row gap-3">
                                                <Select
                                                    label="Tag list"
                                                    items={tagList}
                                                    disallowEmptySelection
                                                    onSelectionChange={(keys) => setTagToDelete(keys as Set<number>)}
                                                >
                                                    {(tag) => (
                                                        <SelectItem key={tag.tag_id} textValue={tag.name}>
                                                            <div className="flex gap-2 items-center">
                                                                <div className="flex flex-col">
                                                                    <span className="text-small">{tag.name}</span>
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    )}
                                                </Select>
                                            </div>
                                            <div className="flex justify-center">
                                                <Button onPress={handleOnDeleteTags}>
                                                    {LanguageTable.mock.tag.delete[language]}
                                                </Button>
                                            </div>
                                        </div>

                                    </Tab>
                                </Tabs>
                            </ModalBody>
                            <ModalFooter>
                                <Button onPress={onClose}>{LanguageTable.mock.tag.close[language]}</Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
            <ScrollShadow className="flex flex-wrap gap-1" orientation="horizontal">
                {questionOwnedTagList?.map((tag) => (
                    <Chip key={tag.tag_id} onClose={() => questionId ? handleRemoveQuestionTag(questionId, tag.tag_id) : {}}>{tag.name}</Chip>
                ))}
            </ScrollShadow>
            <ButtonGroup>
                <Dropdown placement="bottom-end">
                    <DropdownTrigger>
                        <Button className="w-full">
                            {LanguageTable.mock.tag.addTag[language]}
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu
                        aria-label="Merge options"
                        selectionMode="single"
                        selectedKeys={currentSelectedTag}
                        onAction={(e: Key) => handleOnTagSelected(e)}
                        items={tagList}
                    >
                        {(tag: TagModel) => (
                            <DropdownItem key={tag.tag_id} description={tag.name}>
                                {tag.name}
                            </DropdownItem>
                        )}
                    </DropdownMenu>
                </Dropdown>
                <Button onPress={onOpen} color="secondary">
                    {LanguageTable.mock.tag.editTag[language]}
                </Button>
            </ButtonGroup>
        </div >
    );
};