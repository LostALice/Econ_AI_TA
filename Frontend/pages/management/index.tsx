

import DefaultLayout from "@/layouts/default";
import { useEffect, useState, useContext } from "react";
import { IUserModel, IClassModel } from "@/types/management";
import {
    Spinner,
    Input,
    Button,
    addToast,
    Autocomplete,
    AutocompleteItem,
    Listbox,
    ListboxItem,
    Chip,
} from "@heroui/react";
import {
    fetchClass,
    fetchClassUserList,
    fetchUser,
    newClass,
    newUser,
    removeClass,
    removeUser
} from "@/api/management/index"
import { LanguageTable } from "@/i18n";
import { LangContext } from "@/contexts/LangContext";

export default function ManagementPage() {
    const { language, setLang } = useContext(LangContext)
    const [loading, setLoading] = useState(true);

    const [classes, setClasses] = useState<IClassModel[]>([]);
    const [newClassName, setNewClassName] = useState<string>("");
    const [currentClassId, setCurrentClassId] = useState<number | null>(null)

    const [usersNotInClass, setUsersNotInClass] = useState<IUserModel[]>([]);
    const [usersInClass, setUsersInClass] = useState<IUserModel[]>([]);
    const [selectedUserToAdd, setSelectedUserToAdd] = useState<number[]>([]);
    const [selectedUserToRemove, setSelectedUserToRemove] = useState<number[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userList = await fetchUser();
                setUsersNotInClass(userList);

                const classList = await fetchClass();
                setClasses(classList);
            } catch (error) {
                addToast({
                    title: LanguageTable.management.toast.fetchInitDataFailed[language],
                    color: "danger",
                });
            } finally {
                setLoading(false);
            }
        };
        setLoading(true)
        fetchData();
    }, [language]);

    const handleNewClass = async () => {
        if (!newClassName) {
            addToast({
                title: LanguageTable.management.toast.classNameEmpty[language],
                color: "warning",
            });
            return;
        }

        try {
            const result = await newClass(newClassName);

            if (result) {
                const updatedClassList = await fetchClass();
                setClasses(updatedClassList);
                addToast({
                    title: `${LanguageTable.management.toast.classCreated[language]}: ${newClassName}`,
                    color: "success",
                });
            } else {
                addToast({
                    title: `${LanguageTable.management.toast.classCreateFailedRetry[language]}: ${newClassName}.`,
                    color: "danger",
                });
            }
        } catch (error) {
            addToast({
                title: `${LanguageTable.management.toast.classCreateUnexpectedError[language]}: ${newClassName}`,
                color: "danger",
            });
            console.error("Error creating class:", error);
        }
    };

    const handleNewUser = async () => {
        if (selectedUserToAdd.length === 0) {
            addToast({
                title: LanguageTable.management.toast.noUserSelectedToAdd[language],
                color: "warning",
            });
            return;
        }
        if (currentClassId === null) {
            addToast({
                title: LanguageTable.management.toast.noClassSelected[language],
                color: "warning",
            });
            return;
        }

        try {
            selectedUserToAdd.map((userId) => newUser(currentClassId, userId))
            addToast({
                title: `${LanguageTable.management.toast.usersAddedSuccess[language].replace('{count}', selectedUserToAdd.length.toString())}`,
                color: "success",
            });

            const classUserList = await fetchClassUserList(currentClassId);
            setUsersInClass(classUserList);
            setSelectedUserToAdd([]);
        } catch (error) {
            addToast({
                title: LanguageTable.management.toast.addUsersFailed[language],
                color: "danger",
            });
        }
    };

    const handleDeleteClass = async () => {
        if (currentClassId === null) {
            addToast({
                title: LanguageTable.management.toast.noClassSelected[language],
                color: "warning",
            });
            return;
        }

        try {
            const result = await removeClass(currentClassId);
            if (result == 0) {
                const updatedClassList = await fetchClass();
                setClasses(updatedClassList);
                setCurrentClassId(null);
                setUsersInClass([]);
                addToast({
                    title: LanguageTable.management.toast.classDeletedSuccess[language],
                    color: "success",
                });
            } else {
                addToast({
                    title: LanguageTable.management.toast.classDeleteFailedApiError[language],
                    color: "danger",
                });
            }
        } catch (error) {
            addToast({
                title: LanguageTable.management.toast.classDeleteUnexpectedError[language],
                color: "danger",
            });
            console.error("Error deleting class:", error);
        }
    };

    const handleDeleteUser = async () => {
        if (currentClassId == null) {
            addToast({
                title: LanguageTable.management.toast.noClassSelected[language],
                color: "warning",
            });
            return;
        }

        if (selectedUserToRemove.length <= 0) {
            addToast({
                title: LanguageTable.management.toast.removeUserCountZero[language],
                color: "warning",
            });
            return;
        }
        try {
            selectedUserToRemove.map((userId) => removeUser(currentClassId, userId))
            addToast({
                title: `${LanguageTable.management.toast.usersRemovedSuccess[language].replace('{count}', selectedUserToRemove.length.toString())}`,
                color: "success",
            });

            const classUserList = await fetchClassUserList(currentClassId);
            setUsersInClass(classUserList);
            setSelectedUserToRemove([]);
        } catch (error) {
            addToast({
                title: LanguageTable.management.toast.removeUsersFailed[language],
                color: "danger",
            });
            console.error("Error removing users:", error);
        }
    };

    const handleOnSelectClass = async (key: React.Key) => {
        setCurrentClassId(key as number);
        try {
            const classUserList = await fetchClassUserList(key as number);
            setUsersInClass(classUserList);
        } catch (error) {
            addToast({
                title: "Failed to load users for the selected class.",
                color: "danger",
            });
            console.error("Error fetching class user list:", error);
            setUsersInClass([]);
        }
    };

    const handleOnSelectAddUser = (keys: Set<string>) => {
        const selectedUserIds = new Set([...keys].map(Number));
        const userIdsInClass = new Set(usersInClass.map(user => user.user_id));

        const usersToActuallyAdd = [...selectedUserIds].filter(userId => !userIdsInClass.has(userId))

        setSelectedUserToAdd(usersToActuallyAdd);
    };

    if (loading) return (
        <DefaultLayout>
            <div className="p-8 text-center text-xl">
                <Spinner className="text-xl" size="lg" label="Loading..." />
            </div>
        </DefaultLayout>
    );

    return (
        <DefaultLayout>
            <div className="container mx-auto h-max p-8">
                <h1 className="text-4xl font-bold mb-8 text-center">Class Management Dashboard</h1>
                <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-3 items-center">
                    <Autocomplete
                        className="max-w-xs"
                        label={LanguageTable.management.controls.selectClassLabel[language]}
                        size="sm"
                        onSelectionChange={key => { if (key) handleOnSelectClass(key); }}
                    >
                        {
                            classes.map((item) => (
                                <AutocompleteItem
                                    key={item.class_id}
                                    textValue={item.classname}
                                >
                                    <span>
                                        {item.classname}
                                    </span>
                                </AutocompleteItem>
                            ))
                        }
                    </Autocomplete>
                    <Input
                        size="sm"
                        label={LanguageTable.management.controls.newClassNameLabel[language]}
                        type="text"
                        isClearable
                        placeholder={LanguageTable.management.controls.classNamePlaceholder[language]}
                        value={newClassName}
                        onValueChange={setNewClassName}
                        className="focus:outline-none focus:ring-2 focus:ring-offset-2"
                    />
                    <Button size="lg" onPress={handleNewClass} color="primary">
                        {LanguageTable.management.controls.newClassButton[language]}
                    </Button>
                    <Button size="lg" color="danger" onPress={handleDeleteClass}>
                        {LanguageTable.management.controls.deleteClassButton[language]}
                    </Button>
                </div>
                <h2 className="text-center py-3">
                    {
                        currentClassId == null ?
                            LanguageTable.management.display.noClassSelectedStatus[language] :
                            `${LanguageTable.management.display.currentClassStatus[language]}: ${classes.find(cls => cls.class_id == currentClassId)?.classname}`
                    }
                </h2>
                <div className="grid grid-cols-3 gap-1 h-max">
                    <Listbox
                        selectionMode="multiple"
                        aria-label={LanguageTable.management.listbox.userNotInClassLabel[language]}
                        className="border border-default-300 rounded-md"
                        items={usersNotInClass}
                        topContent={
                            <div className="flex gap-1 p-1">
                                <Chip>{`${selectedUserToAdd.length} ${LanguageTable.management.listbox.userSelectedChip[language]}`}</Chip>
                                <Chip>{`${usersNotInClass.length} ${LanguageTable.management.listbox.userTotalChip[language]}`}</Chip>
                            </div>
                        }
                        onSelectionChange={(key) => {
                            handleOnSelectAddUser(key as Set<string>)
                        }}
                    >
                        {usersNotInClass
                            .filter(item => item.role_name !== "Admin")
                            .map((item) => (
                                <ListboxItem key={item.user_id}>
                                    {item.username}
                                </ListboxItem>
                            ))
                        }
                    </Listbox>
                    <div className="flex flex-col col-span-1 rounded-md p-3 gap-3 items-center">
                        <Button onPress={handleNewUser} className="w-full" color="primary">
                            {LanguageTable.management.buttons.addButton[language]} {/* Translated button text */}
                        </Button>
                        <Button onPress={handleDeleteUser} className="w-full" color="danger">
                            {LanguageTable.management.buttons.removeButton[language]} {/* Translated button text */}
                        </Button>
                    </div>
                    <Listbox
                        aria-label={LanguageTable.management.listbox.userInClassLabel[language]}
                        selectionMode="multiple"
                        className="border border-default-300 rounded-md"
                        items={usersInClass}
                        topContent={
                            <div className="flex gap-1 p-1">
                                <Chip>{`${selectedUserToRemove.length} ${LanguageTable.management.listbox.userSelectedChip[language]}`}</Chip> {/* Dynamic chip text, reusing same string */}
                                <Chip>{`${usersInClass.length} ${LanguageTable.management.listbox.userTotalChip[language]}`}</Chip> {/* Dynamic chip text, reusing same string */}
                            </div>
                        }
                        onSelectionChange={(key) => setSelectedUserToRemove(Array.from(key).map(value => parseInt(value as string)))}
                    >
                        {(item) => (
                            <ListboxItem
                                key={item.user_id}
                            >
                                {item.username}
                            </ListboxItem>
                        )}

                    </Listbox>
                </div>

            </div>
        </DefaultLayout >
    )
}