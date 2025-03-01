import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site";
import { useState, useContext } from "react";

import {
  Listbox,
  ListboxItem,
  Spinner,
  Link,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/react";

import { LanguageTable } from "@/i18n";
import { LangContext } from "@/contexts/LangContext";

import { fetchDocsList } from "@/pages/api/api";
import { IDepartment } from "@/types/global";
import { IDocsFormat } from "@/types/api/types";

export default function DocsPage() {
  const { language, setLang } = useContext(LangContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<IDocsFormat[]>([]);

  const departmentList: IDepartment[] = [
    { departmentName: "pptx" },
    { departmentName: "docx" },
  ];

  async function loadFileList(departmentName: IDepartment) {
    setIsLoading(true);
    setFileList(await fetchDocsList(departmentName.toString()));
    setIsLoading(false);
  }

  return (
    <DefaultLayout>
      <div className="flex">
        <div className="mt-1 mx-3">
          {/* <FileUploadButton /> */}
          <Listbox
            disallowEmptySelection
            aria-label="Actions"
            className="h-full w-[15rem]"
            onAction={(key: IDepartment) => loadFileList(key)}
            variant="flat"
            selectionMode="single"
            items={departmentList}
            emptyContent={<Spinner color="success" label={LanguageTable.docs.page.loading[language]} />}
          >
            {(item: IDepartment) => (
              <ListboxItem key={item.departmentName}>
                {item.departmentName}
              </ListboxItem>
            )}
          </Listbox>
        </div>
        <Table aria-label="file table" isStriped>
          <TableHeader>
            <TableColumn key="name">{LanguageTable.docs.page.lessonName[language]}</TableColumn>
            <TableColumn key="height">{LanguageTable.docs.page.lastUpdate[language]}</TableColumn>
          </TableHeader>
          <TableBody
            items={fileList}
            isLoading={isLoading}
            loadingContent={<Spinner color="success" label={LanguageTable.docs.page.loading[language]} />}
          >
            {(item: IDocsFormat) => (
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
