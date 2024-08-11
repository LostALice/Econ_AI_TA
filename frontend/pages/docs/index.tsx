import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site";
import { useState } from "react";

import { Listbox, ListboxItem } from "@nextui-org/listbox";
import { Spinner } from "@nextui-org/spinner";
import { Link } from "@nextui-org/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@nextui-org/table";

import { FileUploadButton } from "@/components/fileUpload-btn";

import { fetchDocsList } from "@/pages/api/api";
import { IDocsFormat } from "@/types/api";
import { IDepartment } from "@/types/";

export default function DocsPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<IDocsFormat[]>([]);

  const departmentList: IDepartment[] = [
    { departmentName: "pptx" },
    { departmentName: "docx" },
  ];

  async function loadFileList(departmentName: React.Key) {
    setIsLoading(true);
    setFileList(await fetchDocsList(departmentName.toString()));
    setIsLoading(false);
  }

  return (
    <DefaultLayout>
      <div className="flex">
        <div className="mt-1 mx-3">
           <FileUploadButton />
          <Listbox
            disallowEmptySelection
            aria-label="Actions"
            className="h-full w-[15rem]"
            onAction={(key) => loadFileList(key)}
            variant="flat"
            selectionMode="single"
            items={departmentList}
            emptyContent={<Spinner color="success" label="加載中..." />}
          >
            {(item) => (
              <ListboxItem key={item.departmentName}>
                {item.departmentName}
              </ListboxItem>
            )}
          </Listbox>
        </div>
        <Table aria-label="file table" isStriped>
          <TableHeader>
            <TableColumn key="name">文件名稱</TableColumn>
            <TableColumn key="height">最後更新日期</TableColumn>
          </TableHeader>
          <TableBody
            items={fileList}
            isLoading={isLoading}
            loadingContent={<Spinner color="success" label="加載中..." />}
          >
            {(item) => (
              <TableRow key={item.fileID}>
                <TableCell>
                  <Link
                    href={
                      siteConfig.api_url?.toString() + "/documentation/" + item.fileID
                    }
                    underline="none"
                  >
                    {item.fileName}
                  </Link>
                </TableCell>
                <TableCell> {item.lastUpdate} </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DefaultLayout>
  );
}
