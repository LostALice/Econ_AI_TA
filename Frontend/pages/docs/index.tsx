import DefaultLayout from "@/layouts/default";
import { siteConfig } from "@/config/site";
import { useState, useContext, Key } from "react";

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
import { IDocsFormat } from "@/types/api/types";

import { FileUploadButton } from "@/components/upload/fileUpload-btn";

export default function DocsPage() {
  const { language, setLang } = useContext(LangContext);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileList, setFileList] = useState<IDocsFormat[]>([]);

  // Not recommended to change following key, unless you know what you are doing.
  // Not recommended to change following key, unless you know what you are doing.
  // Not recommended to change following key, unless you know what you are doing.
  const documentationTypeList = [
    {
      key: "TESTING",
      label: LanguageTable.docs.page.testing[language],
    },
    {
      key: "THEOREM",
      label: LanguageTable.docs.page.theorem[language],
    }
  ];

  async function loadFileList(documentationType: string) {
    setIsLoading(true);
    setFileList(await fetchDocsList(documentationType));
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
            onAction={(key) => loadFileList(key as string)}
            variant="flat"
            selectionMode="single"
            items={documentationTypeList}
            emptyContent={<Spinner color="success" label={LanguageTable.docs.page.loading[language]} />}
          >
            {(item) => (
              <ListboxItem key={item.key}>
                {item.label}
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
