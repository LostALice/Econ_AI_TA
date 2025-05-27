// Code by AkinoAlice@TyrantRey

import DefaultLayout from "@/layouts/default";
import { useEffect, useState, useMemo } from "react";
import { IUserModel, IClassModel } from "@/types/management";
import { Spinner, Input, NumberInput, Button, addToast } from "@heroui/react";
import { fetchClass, fetchTeacher, fetchUser, newClass, newUser, removeClass, removeUser } from "@/api/management/index"

export default function ManagementPage() {
    const [teachers, setTeachers] = useState<IUserModel[]>([]);
    const [users, setUsers] = useState<IUserModel[]>([]);
    const [classes, setClasses] = useState<IClassModel[]>([]);
    const [loading, setLoading] = useState(true);

    const [newClassName, setNewClassName] = useState<string>("");
    const [userIdToAdd, setUserIdToAdd] = useState<number>(0);
    const [userClassIdToAdd, setUserClassIdToAdd] = useState<number>(0);
    const [userIdToRemove, setUserIdToRemove] = useState<number>(0)
    const [userClassIdToRemove, setUserClassIdToRemove] = useState<number>(0)
    const [classIdToRemove, setClassIdToRemove] = useState<number>(0)

    useEffect(() => {
        const fetchData = async () => {
            const teacherList = await fetchTeacher()
            setTeachers(teacherList);

            const userList = await fetchUser()
            setUsers(userList);

            const classList = await fetchClass()
            setClasses(classList);
        };

        fetchData();
        setLoading(false);
    }, []);

    const handleNewClass = async () => {
        if (!newClassName) return;

        const result = await newClass(newClassName);
        if (result) {
            const updatedClassList = await fetchClass()
            setClasses(updatedClassList);
            addToast({
                title: "Created new Class" + newClassName,
                color: "success",
            })
        } else {
            addToast({
                title: "Failed to created new Class" + newClassName,
                color: "danger",
            })
        }
    };

    const handleNewUser = async () => {
        if (userIdToAdd === 0 || userClassIdToAdd === 0) return;

        const result = await newUser(userClassIdToAdd, userIdToAdd);
        if (result) {
            const updatedClassList = await fetchClass()
            setClasses(updatedClassList);
            addToast({
                title: "Add new user to class",
                color: "success",
            })
        } else {
            addToast({
                title: "Failed to add new user to class",
                color: "danger",
            })
        }

    };

    const handleDeleteClass = async () => {
        if (classIdToRemove === 0) return;

        const result = await removeClass(classIdToRemove);
        if (result) {
            const updatedClassList = await fetchClass()
            setClasses(updatedClassList);
            addToast({
                title: "Deleted class",
                color: "success",
            })
        } else {
            addToast({
                title: "Failed to delete class",
                color: "danger",
            })
        }
    };

    const handleDeleteUser = async () => {
        if (userClassIdToRemove === 0 || userIdToRemove === 0) return;

        const result = await removeUser(userClassIdToRemove, userIdToRemove);
        if (result) {
            const updatedClassList = await fetchClass()
            setClasses(updatedClassList);
            addToast({
                title: "Deleted user",
                color: "success",
            })
        } else {
            addToast({
                title: "Failed to delete user",
                color: "danger",
            })
        }
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
            <div className="container mx-auto p-8 font-sans">
                <h1 className="text-4xl font-bold mb-8 text-center">Class Management Dashboard</h1>
                <section className="mb-10 p-6 border rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">Teacher List</h2>
                    {teachers.length === 0 ? (
                        <p className="text-gray-500">No teachers found.</p>
                    ) : (
                        <ul className="list-none p-0">
                            {teachers.map((teacher) => (
                                <li key={teacher.user_id} className="py-2 border-b last:border-b-0">
                                    User ID: {teacher.user_id}, Username: {teacher.username}, Role: {teacher.role_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
                <section className="mb-10 p-6 border rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">User List</h2>
                    {users.length === 0 ? (
                        <p className="text-gray-500">No users found.</p>
                    ) : (
                        <ul className="list-none p-0">
                            {users.map((user) => (
                                <li key={user.user_id} className="py-2 border-b last:border-b-0">
                                    User ID: {user.user_id}, Username: {user.username}, Role: {user.role_name}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
                <section className="mb-10 p-6 border rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">Class List</h2>
                    {classes.length === 0 ? (
                        <p className="text-gray-500">No classes found.</p>
                    ) : (
                        <ul className="list-none p-0">
                            {classes.map((c) => (
                                <li key={c.class_id} className="py-2 border-b last:border-b-0">
                                    Class ID: {c.class_id}, Class Name: {c.classname}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
                <section className="mb-10 p-6 border rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">Create new Class</h2>
                    <div className="flex gap-4 items-baseline">
                        <Input
                            type="text"
                            isClearable
                            placeholder="Class Name"
                            value={newClassName}
                            onValueChange={setNewClassName}
                            className="focus:outline-none focus:ring-2 focus:ring-offset-2"
                        />
                        <Button size="md" onPress={handleNewClass}>
                            New class
                        </Button>
                    </div>
                </section>
                <section className="mb-10 p-6 border rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">Delete Class</h2>
                    <div className="flex gap-1 items-baseline">
                        <NumberInput
                            isClearable
                            isRequired
                            size="sm"
                            placeholder="Class ID"
                            value={userClassIdToAdd}
                            onValueChange={setClassIdToRemove}
                        />
                        <Button size="md" onPress={handleDeleteClass}>
                            Delete class
                        </Button>
                    </div>
                </section>
                <section className="mb-10 p-6 border rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">New User</h2>
                    <div className="flex gap-1 items-baseline">
                        <NumberInput
                            isClearable
                            isRequired
                            size="sm"
                            placeholder="User ID"
                            value={userIdToAdd}
                            onValueChange={setUserIdToAdd}
                        />
                        <NumberInput
                            isClearable
                            isRequired
                            size="sm"
                            placeholder="Class ID"
                            value={userClassIdToAdd}
                            onValueChange={setUserClassIdToAdd}
                        />
                        <Button size="md" onPress={handleNewUser}>
                            New user
                        </Button>
                    </div>
                </section>
                <section className="mb-10 p-6 border rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4">Delete User</h2>
                    <div className="flex gap-1 items-baseline">
                        <NumberInput
                            isClearable
                            isRequired
                            size="sm"
                            placeholder="User ID"
                            value={userIdToRemove}
                            onValueChange={setUserIdToRemove}
                        />
                        <NumberInput
                            isClearable
                            isRequired
                            size="sm"
                            placeholder="Class ID"
                            value={userClassIdToRemove}
                            onValueChange={setUserClassIdToRemove}
                        />
                        <Button size="md" onPress={handleDeleteUser}>
                            Delete user
                        </Button>
                    </div>
                </section>
            </div>
        </DefaultLayout>
    );
}