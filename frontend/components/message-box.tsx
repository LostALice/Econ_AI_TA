import { FC } from "react";
import { siteConfig } from "@/config/site"

import { Divider } from "@nextui-org/divider";
import { Tooltip } from "@nextui-org/tooltip";
import { Button } from "@nextui-org/button";
import { Link } from "@nextui-org/link";

import { IMessageInfo } from "@/types";


export const MessageBox: FC<IMessageInfo> = ({
	questionUUID,
	question,
	answer,
	files,
	time
}) => {
	return (
		<Tooltip
			content={<span>{time}  {questionUUID}</span>}
			placement="bottom-end"
			delay={5}
			offset={-29}
		>
			<div className="border rounded-lg border-emerald-600 m-3">
				<div className="justify-around p-4">
					<span className="italic">{question}</span>
					<Divider className="my-2" />
					<span className="">{answer}</span>
					<Divider className="my-2" />
					<div className="flex justify-between">
						<div className="flex text-left gap-3">
							{files?.map((file) => (
								<Tooltip
									content={<span className="text-left">{file.file_name}</span>}
									placement="bottom"
									key={file.file_uuid}
								>
									<Button
										size="sm"
										isExternal
										href={siteConfig.api_url?.toString() + "/docs/" + file.file_uuid}
										key={file.file_uuid}
										as={Link}
										showAnchorIcon
										className="text-small w-[7rem] "
									>
										<span className="text-left truncate italic">{file.file_name}</span>
									</Button>
								</Tooltip>
							))}
						</div>
					</div>
				</div>
			</div>
		</Tooltip >
	);
};
