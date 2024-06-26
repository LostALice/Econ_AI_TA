import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site"
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

import { fetchDocsList } from "@/pages/api/api"
import { IDocsFormat } from "@/types/api"
import { IDepartment } from "@/types/"

export default function DocsPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<IDocsFormat[]>([]);

  const departmentList: IDepartment[] = [
    { departmentName: "工程與科學學院" },
    { departmentName: "商學院" },
    { departmentName: "人文社會學院" },
    { departmentName: "資訊電機學院" },
    { departmentName: "建設學院" },
    { departmentName: "金融學院" },
    { departmentName: "國際科技與管理學院" },
    { departmentName: "建築專業學院" },
    { departmentName: "創能學院" },
    { departmentName: "通識教育中心" },
    { departmentName: "經營管理學院" },
    { departmentName: "行政單位" },
    { departmentName: "研究中心" }
  ]

  async function loadFileList(departmentName: React.Key) {
    setIsLoading(true)
    setFileList(await fetchDocsList(departmentName.toString()))
    setIsLoading(false)
  }

  return (
    <DefaultLayout>
      <div className="flex">
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
            <ListboxItem key={item.departmentName}>{item.departmentName}</ListboxItem>
          )}
        </Listbox>

        <Table aria-label="file table"
          isStriped
        >
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
                  <Link href={siteConfig.api_url?.toString() + "/docs/" + item.fileID} underline="none">{item.fileName}</Link>
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
