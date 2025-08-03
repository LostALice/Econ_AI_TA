# Code by wonmeow
# Modify by AkinoAlice@TyrantRey 3/8/2025

import base64
import pandas as pd  # type: ignore[import-untyped]
import io
import zipfile
import tempfile
import os
import shutil

from collections import Counter
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

from Backend.utils.helper.model.database.excel import ResultModel
from Backend.utils.helper.model.excel import ValidatedQuestionModel
from Backend.utils.database.excel import ExcelDatabaseController
from Backend.utils.helper.logger import CustomLoggerHandler

excel_database_controller = ExcelDatabaseController()


class XlsxImageExtractor:
    def __init__(self, xlsx_path):
        self.logger = CustomLoggerHandler().get_logger()
        self.xlsx_path = xlsx_path
        self.temp_dir = Path("temp_extraction")
        self.output_dir = Path("extracted_images")
        self.question_numbers = {}
        self.namespace = {
            "w": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
        }

    def setup_directories(self):
        """設置必要的目錄"""
        for directory in [self.temp_dir, self.output_dir]:
            if directory.exists():
                shutil.rmtree(directory)
            directory.mkdir(parents=True)

    def extract_xlsx(self):
        """使用 zipfile 解壓縮 xlsx 檔案"""
        try:
            self.logger.info("解壓縮 Excel 檔案...")

            # 建立臨時目錄
            self.setup_directories()

            # 使用 zipfile 解壓縮
            with zipfile.ZipFile(self.xlsx_path, "r") as zip_ref:
                # 檢查 ZIP 檔案的完整性
                if zip_ref.testzip() is not None:
                    self.logger.error("Excel 檔案已損壞")
                    return False

                # 顯示 ZIP 檔案內容
                self.logger.info("Excel 檔案包含以下檔案:")
                for item in zip_ref.namelist():
                    self.logger.info(f"  {item}")

                # 解壓縮所有檔案
                zip_ref.extractall(self.temp_dir)

                # 驗證必要檔案是否存在
                required_files = ["xl/worksheets/sheet1.xml", "xl/media"]

                for file_path in required_files:
                    full_path = self.temp_dir / file_path
                    if not full_path.exists():
                        self.logger.warning(f"找不到必要的檔案: {file_path}")

                return True

        except zipfile.BadZipFile:
            self.logger.error("無法解壓縮 Excel 檔案，檔案可能已損壞")
            return False
        except Exception as e:
            self.logger.error(f"解壓縮過程發生錯誤: {str(e)}")
            return False

    def read_worksheet_xml(self):
        """從 XML 直接讀取工作表內容"""
        self.logger.info("開始讀取工作表 XML...")

        try:
            worksheet_path = self.temp_dir / "xl" / "worksheets" / "sheet1.xml"
            if not worksheet_path.exists():
                self.logger.error("找不到工作表 XML 檔案")
                return

            # 讀取 sharedStrings.xml 以獲取字串內容
            shared_strings = self._load_shared_strings()

            tree = ET.parse(worksheet_path)
            root = tree.getroot()

            # 修正命名空間
            ns = {"w": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

            # 讀取所有儲存格
            for row in root.findall(".//w:row", ns):
                row_num = int(row.get("r", "0"))
                cells = row.findall(".//w:c", ns)

                # 取得 A、B、C 欄的儲存格
                a_cell = next(
                    (c for c in cells if c.get("r", "").startswith(f"A{row_num}")), None
                )
                b_cell = next(
                    (c for c in cells if c.get("r", "").startswith(f"B{row_num}")), None
                )
                c_cell = next(
                    (c for c in cells if c.get("r", "").startswith(f"C{row_num}")), None
                )

                if all([a_cell, b_cell, c_cell]):
                    # 取得儲存格值
                    def get_cell_value(cell):
                        if cell.get("t") == "s":  # 字串類型，需要查詢 sharedStrings
                            v = cell.find(".//w:v", ns)
                            if v is not None and v.text:
                                index = int(v.text.strip())
                                return shared_strings.get(index, f"未知字串 {index}")
                        else:  # 數值類型
                            v = cell.find(".//w:v", ns)
                            return v.text.strip() if v is not None and v.text else None

                    question_no = get_cell_value(a_cell)
                    chapter_no = get_cell_value(b_cell)
                    question_text = get_cell_value(c_cell)

                    if all([question_no, chapter_no, question_text]):
                        # 使用 QuestionNo 和 ChapterNo 組合作為唯一識別碼
                        unique_id = f"{chapter_no}_{question_no}"

                        self.question_numbers[unique_id] = {
                            "question_no": question_no,
                            "chapter_no": chapter_no,
                            "number": f"{chapter_no}.{question_no}",
                            "row": row_num,
                            "col": 3,
                            "full_text": question_text,
                        }
                        self.logger.info(f"找到題號: {chapter_no}.{question_no}")

            self.logger.info(f"總共找到 {len(self.question_numbers)} 個題號")

        except ET.ParseError as e:
            self.logger.error(f"解析 XML 時發生錯誤: {str(e)}")
        except Exception as e:
            self.logger.error(f"讀取工作表時發生錯誤: {str(e)}")
            self.logger.error(str(e))

    def _load_shared_strings(self):
        """載入 sharedStrings.xml 檔案中的字串資料"""
        shared_strings = {}
        try:
            shared_strings_path = self.temp_dir / "xl" / "sharedStrings.xml"
            if not shared_strings_path.exists():
                self.logger.warning("找不到 sharedStrings.xml 檔案")
                return shared_strings

            tree = ET.parse(shared_strings_path)
            root = tree.getroot()

            # 命名空間
            ns = {"w": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

            # 讀取所有字串
            for i, si in enumerate(root.findall(".//si", ns)):
                t = si.find(".//t", ns)
                if t is not None:
                    shared_strings[i] = t.text
                else:
                    shared_strings[i] = f"空字串 {i}"

            self.logger.info(
                f"從 sharedStrings.xml 載入了 {len(shared_strings)} 個字串"
            )
            return shared_strings

        except Exception as e:
            self.logger.error(f"載入 sharedStrings.xml 時發生錯誤: {str(e)}")
            return shared_strings

    def analyze_worksheet_for_images(self):
        """從 sheet1.xml 中分析圖片與題號的關聯"""
        self.logger.info("從 sheet1.xml 分析圖片與題號關聯...")

        image_mappings = {}
        try:
            worksheet_path = self.temp_dir / "xl" / "worksheets" / "sheet1.xml"
            if not worksheet_path.exists():
                self.logger.error("找不到 sheet1.xml 檔案")
                return image_mappings

            # 讀取 sharedStrings.xml 以獲取字串內容
            shared_strings = self._load_shared_strings()

            # 解析 XML
            tree = ET.parse(worksheet_path)
            root = tree.getroot()
            ns = {"w": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

            # 尋找所有含有 #VALUE! 的儲存格（這些是圖片）
            image_cells = []
            for row in root.findall(".//w:row", ns):
                row_num = int(row.get("r", "0"))
                for cell in row.findall(".//w:c", ns):
                    if cell.get("t") == "e":
                        v_element = cell.find(".//w:v", ns)
                        if v_element is not None and v_element.text == "#VALUE!":
                            vm_value = cell.get("vm", "")
                            if not vm_value:
                                continue
                            cell_ref = cell.get("r", "")
                            image_cells.append(
                                {
                                    "row_num": row_num,
                                    "cell_ref": cell_ref,
                                    "vm_value": vm_value,
                                }
                            )
                            self.logger.info(
                                f"在第 {row_num} 行找到圖片 (vm={vm_value})"
                            )

            # 建立圖片與題號的關係
            for img_cell in image_cells:
                row_num = img_cell["row_num"]
                vm_value = img_cell["vm_value"]

                # 從該行取得題號和章節資訊
                for row in root.findall(f".//w:row[@r='{row_num}']", ns):
                    # 取得 A、B 欄的儲存格（題號和章節）
                    cells = row.findall(".//w:c", ns)
                    a_cell = next(
                        (c for c in cells if c.get("r", "").startswith(f"A{row_num}")),
                        None,
                    )
                    b_cell = next(
                        (c for c in cells if c.get("r", "").startswith(f"B{row_num}")),
                        None,
                    )
                    c_cell = next(
                        (c for c in cells if c.get("r", "").startswith(f"C{row_num}")),
                        None,
                    )

                    # 取得儲存格值
                    question_no = None
                    chapter_no = None
                    question_text = None

                    # 處理 A 欄（題號）
                    if a_cell is not None:
                        if a_cell.get("t") == "s":  # 字串類型
                            v = a_cell.find(".//w:v", ns)
                            if v is not None and v.text:
                                index = int(v.text.strip())
                                question_no = shared_strings.get(index, "")
                        else:  # 數值類型
                            v = a_cell.find(".//w:v", ns)
                            if v is not None and v.text:
                                question_no = v.text.strip()

                    # 處理 B 欄（章節）
                    if b_cell is not None:
                        if b_cell.get("t") == "s":  # 字串類型
                            v = b_cell.find(".//w:v", ns)
                            if v is not None and v.text:
                                index = int(v.text.strip())
                                chapter_no = shared_strings.get(index, "")
                        else:  # 數值類型
                            v = b_cell.find(".//w:v", ns)
                            if v is not None and v.text:
                                chapter_no = v.text.strip()

                    # 處理 C 欄（問題文字）
                    if c_cell is not None:
                        if c_cell.get("t") == "s":  # 字串類型
                            v = c_cell.find(".//w:v", ns)
                            if v is not None and v.text:
                                index = int(v.text.strip())
                                question_text = shared_strings.get(index, "")
                        else:  # 數值類型
                            v = c_cell.find(".//w:v", ns)
                            if v is not None and v.text:
                                question_text = v.text.strip()

                    # 為圖片建立映射，使用行號+VM值作為唯一鍵
                    mapping_key = f"{row_num}_{vm_value}"
                    image_mappings[mapping_key] = {
                        "row": row_num,
                        "question_no": question_no,
                        "chapter_no": chapter_no,
                        "question_text": question_text,
                        "vm_value": vm_value,
                    }

                    self.logger.info(
                        f"圖片 (行={row_num}, vm={vm_value}) 對應題號 {chapter_no}.{question_no}"
                    )

            return image_mappings

        except ET.ParseError as e:
            self.logger.error(f"解析 XML 時發生錯誤: {str(e)}")
            return image_mappings
        except Exception as e:
            self.logger.error(f"分析 worksheet 時發生錯誤: {str(e)}")
            self.logger.error(str(e))
            return image_mappings

    def process(self, keep_temp=False):
        """處理整個提取和對應過程"""
        try:
            # 使用 zipfile 解壓縮
            if not self.extract_xlsx():
                return None

            # 讀取工作表 XML
            self.read_worksheet_xml()

            # 分析 sheet1.xml 獲取圖片與題號關聯
            image_info = self.analyze_worksheet_for_images()

            # 從 Excel 中提取所有圖片
            self.logger.info("從 Excel 提取圖片...")
            extracted_images = []
            media_dir = self.temp_dir / "xl" / "media"
            if media_dir.exists():
                # 先統計媒體檔案總數
                media_files = [
                    file
                    for file in media_dir.glob("*")
                    if file.is_file()
                    and file.suffix.lower() in [".png", ".jpg", ".jpeg", ".gif"]
                ]

                # 複製圖片並建立對應關係
                result = {}

                # 按照行號_VM值的對應關係建立映射
                image_mappings = list(image_info.keys())
                self.logger.info(
                    f"找到 {len(image_mappings)} 個圖片映射: {', '.join(image_mappings)}"
                )

                # 確保 media_files 和 image_mappings 有合適數量的元素
                if len(media_files) < len(image_mappings):
                    self.logger.warning(
                        f"警告: 圖片文件數量 ({len(media_files)}) 少於映射數量 ({len(image_mappings)})"
                    )

                # 為每個映射分配圖片
                sorted_mappings = sorted(
                    image_mappings,
                    key=lambda k: (int(k.split("_")[0]), int(k.split("_")[1])),
                )

                # 按 VM 值分組收集映射
                vm_to_mappings = {}
                for mapping_key in sorted_mappings:
                    row, vm = mapping_key.split("_")
                    if vm not in vm_to_mappings:
                        vm_to_mappings[vm] = []
                    vm_to_mappings[vm].append(mapping_key)

                # 遍歷所有 VM 組
                for vm_value, vm_mappings in sorted(
                    vm_to_mappings.items(), key=lambda x: int(x[0])
                ):
                    # 查找對應的圖片文件
                    vm_index = list(sorted(vm_to_mappings.keys())).index(vm_value)

                    if vm_index < len(media_files):
                        image_file = sorted(media_files, key=lambda x: x.name)[vm_index]
                        base_name, ext = os.path.splitext(image_file.name)

                        # 為該 VM 值下的每個映射複製圖片
                        for i, mapping_key in enumerate(vm_mappings):
                            # 如果同一 VM 有多個映射，添加後綴
                            if len(vm_mappings) > 1:
                                image_name = f"{base_name}_{i + 1}{ext}"
                            else:
                                image_name = image_file.name

                            dest_path = self.output_dir / image_name
                            shutil.copy2(image_file, dest_path)
                            extracted_images.append(image_name)

                            # 使用映射鍵來查找相關信息
                            info = image_info[mapping_key]
                            result[image_name] = {
                                "cell_position": f"行 {info['row']}",
                                "question_no": info["question_no"],
                                "chapter_no": info["chapter_no"],
                                "unique_id": f"{info['chapter_no']}_{info['question_no']}",
                                "question": f"{info['chapter_no']}.{info['question_no']}",
                                "question_text": info["question_text"],
                                "vm_value": info["vm_value"],
                                "mapping_key": mapping_key,
                                "original_image": image_file.name,
                            }
                            self.logger.info(
                                f"圖片 {image_name} (行={info['row']}, VM={info['vm_value']}) 對應到題號 {info['chapter_no']}.{info['question_no']}"
                            )
                    else:
                        for mapping_key in vm_mappings:
                            self.logger.warning(
                                f"映射 {mapping_key} 沒有對應的圖片文件"
                            )

            # 生成報告
            report = {
                "total_questions": len(self.question_numbers),
                "total_images": len(extracted_images),
                "total_mappings": len(image_info),
                "question_details": {
                    unique_id: {
                        "question_no": info["question_no"],
                        "chapter_no": info["chapter_no"],
                        "number": info["number"],
                        "full_text": info["full_text"],
                    }
                    for unique_id, info in self.question_numbers.items()
                },
                "image_mappings": result,
                "extracted_images": extracted_images,
            }

            self.logger.info(
                f"處理完成！找到 {len(self.question_numbers)} 個題號和 {len(extracted_images)} 張圖片，共 {len(image_info)} 個映射關係"
            )
            return report

        except Exception as e:
            self.logger.error(f"處理過程中發生錯誤: {str(e)}")
            return None
        finally:
            # 如果不保留臨時檔案，則清理
            if not keep_temp:
                try:
                    if self.temp_dir.exists():
                        shutil.rmtree(self.temp_dir)
                        self.logger.info("已清理臨時檔案")
                except Exception as e:
                    self.logger.error(f"清理臨時檔案時發生錯誤: {str(e)}")


class ExcelHandler:
    """Excel 檔案處理類"""

    def __init__(self) -> None:
        self.logger = CustomLoggerHandler().get_logger()

    # @staticmethod
    def save_questions_to_db(
        self,
        questions: list[ValidatedQuestionModel],
        file_id: str,
        file_name: str,
        doc_type: str,
    ) -> bool:
        """將題目保存到資料庫

        Args:
            questions: 題目列表
            file_id: 檔案 ID
            file_name: 檔案名稱
            doc_type: 文件類型

        Returns:
            bool: 是否成功保存
        """
        try:
            # 插入題目到資料庫
            result = excel_database_controller.insert_questions(
                questions, file_name, doc_type
            )
            self.logger.info(result)
            if result > 0:
                # 記錄檔案上傳信息到 uploaded_files 表
                upload_result = excel_database_controller.record_file_upload(
                    file_id, file_name, doc_type, result
                )
                if upload_result:
                    self.logger.info(
                        f"成功記錄檔案上傳信息：ID={file_id}, 名稱={file_name}, 類型={doc_type}, 題目數={result}"
                    )
                else:
                    self.logger.warning(
                        f"記錄檔案上傳信息失敗：ID={file_id}, 名稱={file_name}"
                    )

            return result > 0
        except Exception as e:
            self.logger.error(f"保存題目到資料庫時發生錯誤: {str(e)}")
            return False

    def get_file_list(self, doc_type: str | None = None) -> list[dict[str, Any]]:
        """獲取檔案列表

        Args:
            doc_type: 文件類型過濾條件，如果為 None 則獲取所有類型

        Returns:
            List[Dict[str, Any]]: 檔案列表
        """
        try:
            file_list = excel_database_controller.get_file_list(doc_type)
            return file_list
        except Exception as e:
            self.logger.error(f"獲取檔案列表時發生錯誤: {str(e)}")
            return []

    def get_questions(self, file_id: str) -> tuple[list[dict[str, Any]], str]:
        """獲取指定檔案 ID 的題目

        Args:
            file_id: 檔案 ID

        Returns:
            Tuple[List[Dict[str, Any]], str]: (題目列表, 檔案名稱)
        """
        try:
            questions, file_name = excel_database_controller.get_questions(file_id)
            return questions, file_name
        except Exception as e:
            self.logger.error(f"獲取題目時發生錯誤: {str(e)}")
            return [], ""

    def delete_file(self, file_id: str) -> bool:
        """刪除檔案及其題目

        Args:
            file_id: 檔案 ID

        Returns:
            bool: 是否成功刪除
        """
        try:
            result = excel_database_controller.delete_file_and_questions(file_id)
            return result
        except Exception as e:
            self.logger.error(f"刪除檔案時發生錯誤: {str(e)}")
            return False

    def update_questions(
        self, file_id: str, questions: list[dict[str, Any]]
    ) -> ResultModel:
        """更新題目內容

        Args:
            file_id: 檔案 ID
            questions: 要更新的題目列表

        Returns:
            Dict: 包含更新結果的字典
        """
        try:
            result = excel_database_controller.update_questions(file_id, questions)
            return result
        except Exception as e:
            self.logger.error(f"更新題目時發生錯誤: {str(e)}")
            return ResultModel(
                success=False,
                updated_count=0,
                deleted_count=0,
                error=str(e),
            )

    def parse_excel_to_questions(
        self, file_content: str, file_type: str
    ) -> list[ValidatedQuestionModel]:
        """解析 Excel 檔案內容為題目列表

        Args:
            file_content (str): Base64 編碼的檔案內容
            file_type (str): 檔案類型

        Returns:
            List[Dict[str, Any]]: 題目列表
        """

        def validate_and_fix_question(
            question_data: ValidatedQuestionModel, row_index: int
        ) -> ValidatedQuestionModel:
            """驗證並修正題目資料"""
            # 確保所有必要欄位都存在
            # validated_question = {
            #     "question_no": str(question_data.get("question_no", row_index + 1)),
            #     "chapter_no": str(question_data.get("chapter_no", "未分類")),
            #     "question_text": str(question_data.get("question_text", "未定義題目")),
            #     "option_a": "",
            #     "option_b": "",
            #     "option_c": "",
            #     "option_d": "",
            #     "correct_answer": str(question_data.get("correct_answer", "")),
            #     "explanation": str(question_data.get("explanation", "無解釋")),
            #     "picture": question_data.get("picture"),
            # }

            validated_question = ValidatedQuestionModel(
                question_no=question_data.question_no or row_index + 1,
                chapter_no=question_data.chapter_no or "未分類",
                question_text=question_data.question_text or "未定義題目",
                option_a="",
                option_b="",
                option_c="",
                option_d="",
                correct_answer=question_data.correct_answer,
                explanation=question_data.explanation or "無解釋",
                picture=question_data.picture,
            )

            # 驗證並修正選項
            options = [
                question_data.option_a,
                question_data.option_b,
                question_data.option_c,
                question_data.option_d,
            ]

            # 確保每個選項都是有效字串
            for i, option in enumerate(options):
                if not option or not isinstance(option, str) or option.strip() == "":
                    options[i] = f"選項 {chr(65 + i)}"
                    self.logger.warning(
                        f"題目 {validated_question.question_no} 的選項 {chr(65 + i)} 為空，使用預設值"
                    )
                else:
                    options[i] = str(option).strip()

            validated_question.option_a = options[0]
            validated_question.option_b = options[1]
            validated_question.option_c = options[2]
            validated_question.option_d = options[3]

            return validated_question

        try:
            # 解碼 Base64 內容
            content = file_content
            if "base64," in content:
                content = content.split("base64,")[1]

            binary_data = base64.b64decode(content)
            buffer = io.BytesIO(binary_data)

            # 使用臨時文件保存Excel內容
            with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as temp_file:
                temp_file_path = temp_file.name
                temp_file.write(binary_data)

            # 使用新的 XlsxImageExtractor 處理 Excel 檔案
            extractor = XlsxImageExtractor(temp_file_path)
            report = extractor.process(keep_temp=False)

            if not report:
                self.logger.warning("無法從 Excel 檔案提取圖片數據，但繼續處理文字內容")
                report = {"image_mappings": {}}

            # 使用 pandas 讀取 Excel 以獲取題目內容
            df = pd.read_excel(buffer)

            # 調整欄位名稱，處理可能的空格或大小寫差異
            df.columns = [col.strip() for col in df.columns]

            # 輸出詳細的檔案結構調試信息
            self.logger.info("=== Excel 檔案結構分析 ===")
            self.logger.info(f"Excel 檔案的欄位名稱: {list(df.columns)}")
            self.logger.info(f"總行數: {len(df)}")

            # 輸出前幾行的資料樣本
            if len(df) > 0:
                self.logger.info(f"第一行資料: {dict(df.iloc[0])}")
            if len(df) > 1:
                self.logger.info(f"第二行資料: {dict(df.iloc[1])}")

            # 檢查必要欄位是否存在
            required_fields = [
                "QuestionNo.",
                "ChapterNo",
                "QuestionInChinese",
                "AnswerAInChinese",
                "AnswerBInChinese",
                "AnswerCInChinese",
                "AnswerDInChinese",
                "CorrectAnswer",
                "AnswerExplainInChinese",
            ]

            column_mapping = {}

            # 首先嘗試精確匹配標準欄位
            for col in df.columns:
                # 處理必要欄位
                for req in required_fields:
                    if col.lower() == req.lower() or col.lower().replace(
                        " ", ""
                    ) == req.lower().replace(".", ""):
                        column_mapping[col] = req
                        self.logger.info(f"精確匹配: {col} -> {req}")

                # 特別處理 PIC 欄位映射到 Picture
                if col.lower() == "pic":
                    column_mapping[col] = "Picture"
                    self.logger.info(f"精確匹配: {col} -> Picture")
                elif col.lower() == "picture":
                    column_mapping[col] = "Picture"
                    self.logger.info(f"精確匹配: {col} -> Picture")

            # 檢查是否有基本的題目欄位（放寬要求，只要有題目欄位即可）
            has_question_field = any(
                field in column_mapping.values() for field in ["QuestionInChinese"]
            )

            if not has_question_field:
                # 嘗試智能匹配欄位
                self.logger.warning("未找到標準欄位格式，嘗試智能匹配...")

                # 更詳細的智能匹配邏輯
                # 1. 智能匹配題目欄位
                question_keywords = [
                    "question",
                    "題目",
                    "問題",
                    "chinese",
                    "內容",
                    "text",
                ]
                for col in df.columns:
                    col_lower = col.lower()
                    if any(keyword in col_lower for keyword in question_keywords):
                        if "QuestionInChinese" not in column_mapping.values():
                            column_mapping[col] = "QuestionInChinese"
                            self.logger.info(
                                f"智能匹配題目欄位: {col} -> QuestionInChinese"
                            )
                            break

                # 2. 智能匹配選項欄位 - 更精確的匹配
                option_patterns = [
                    # 匹配 A 選項的各種可能格式
                    (
                        [
                            "a)",
                            "(a)",
                            "a.",
                            "option a",
                            "answer a",
                            "a選項",
                            "選項a",
                            "answera",
                        ],
                        "AnswerAInChinese",
                    ),
                    # 匹配 B 選項的各種可能格式
                    (
                        [
                            "b)",
                            "(b)",
                            "b.",
                            "option b",
                            "answer b",
                            "b選項",
                            "選項b",
                            "answerb",
                        ],
                        "AnswerBInChinese",
                    ),
                    # 匹配 C 選項的各種可能格式
                    (
                        [
                            "c)",
                            "(c)",
                            "c.",
                            "option c",
                            "answer c",
                            "c選項",
                            "選項c",
                            "answerc",
                        ],
                        "AnswerCInChinese",
                    ),
                    # 匹配 D 選項的各種可能格式
                    (
                        [
                            "d)",
                            "(d)",
                            "d.",
                            "option d",
                            "answer d",
                            "d選項",
                            "選項d",
                            "answerd",
                        ],
                        "AnswerDInChinese",
                    ),
                ]

                for col in df.columns:
                    col_lower = col.lower().replace(" ", "").replace("_", "")
                    for patterns, target_field in option_patterns:
                        if any(pattern in col_lower for pattern in patterns):
                            if target_field not in column_mapping.values():
                                column_mapping[col] = target_field
                                self.logger.info(
                                    f"智能匹配選項欄位: {col} -> {target_field}"
                                )
                                break

                # 3. 智能匹配其他欄位
                for col in df.columns:
                    col_lower = col.lower()

                    # 匹配正確答案欄位
                    if (
                        any(
                            keyword in col_lower
                            for keyword in ["correct", "正確", "答案", "answer"]
                        )
                        and "option" not in col_lower
                    ):
                        if "CorrectAnswer" not in column_mapping.values():
                            column_mapping[col] = "CorrectAnswer"
                            self.logger.info(
                                f"智能匹配答案欄位: {col} -> CorrectAnswer"
                            )

                    # 匹配章節欄位
                    elif any(
                        keyword in col_lower
                        for keyword in ["chapter", "章節", "章", "單元"]
                    ):
                        if "ChapterNo" not in column_mapping.values():
                            column_mapping[col] = "ChapterNo"
                            self.logger.info(f"智能匹配章節欄位: {col} -> ChapterNo")

                    # 匹配題號欄位
                    elif any(
                        keyword in col_lower
                        for keyword in ["questionno", "題號", "編號", "no.", "number"]
                    ):
                        if "QuestionNo." not in column_mapping.values():
                            column_mapping[col] = "QuestionNo."
                            self.logger.info(f"智能匹配題號欄位: {col} -> QuestionNo.")

                    # 匹配解釋欄位
                    elif any(
                        keyword in col_lower
                        for keyword in ["explain", "解釋", "說明", "explanation"]
                    ):
                        if "AnswerExplainInChinese" not in column_mapping.values():
                            column_mapping[col] = "AnswerExplainInChinese"
                            self.logger.info(
                                f"智能匹配解釋欄位: {col} -> AnswerExplainInChinese"
                            )

                self.logger.info(f"智能匹配結果: {column_mapping}")

            # 如果仍然沒有找到題目欄位，嘗試使用第一個非數字欄位作為題目
            if "QuestionInChinese" not in column_mapping.values():
                self.logger.warning("仍未找到題目欄位，嘗試使用啟發式方法...")

                # 檢查每個欄位的內容，找到最可能是題目的欄位
                for col in df.columns:
                    if col not in column_mapping:
                        # 檢查該欄位的內容長度，題目通常比較長
                        sample_values = df[col].dropna().head(3)
                        if len(sample_values) > 0:
                            avg_length = sum(
                                len(str(val)) for val in sample_values
                            ) / len(sample_values)
                            self.logger.info(f"欄位 {col} 的平均內容長度: {avg_length}")

                            # 如果平均長度超過10個字符，可能是題目
                            if avg_length > 10:
                                column_mapping[col] = "QuestionInChinese"
                                self.logger.info(
                                    f"啟發式匹配題目欄位: {col} -> QuestionInChinese (平均長度: {avg_length})"
                                )
                                break

            # 如果還是沒有找到題目欄位，拋出錯誤
            if "QuestionInChinese" not in column_mapping.values():
                self.logger.error(
                    f"Excel 檔案格式不正確，無法找到題目欄位。可用欄位: {list(df.columns)}"
                )
                self.logger.error(f"欄位映射結果: {column_mapping}")
                raise ValueError("Excel 檔案格式不正確，請確保包含題目欄位")

            # 重命名欄位以符合標準格式
            self.logger.info(f"應用欄位映射: {column_mapping}")
            df = df.rename(columns=column_mapping)

            # 統計總行數、有效行數和跳過行數
            total_rows = len(df)
            valid_rows = 0
            skipped_rows = 0
            # 用於記錄跳過的原因
            skipped_reasons: Counter = Counter()

            self.logger.info(f"開始處理 Excel 檔案，總計 {total_rows} 行數據")

            questions = []
            for idx, row in df.iterrows():
                # 檢查題目欄位 - 這是唯一必須的欄位
                if (
                    "QuestionInChinese" not in df.columns
                    or pd.isna(row.get("QuestionInChinese"))
                    or str(row.get("QuestionInChinese")).strip() == ""
                ):
                    reason = "缺少題目內容"
                    skipped_reasons[reason] = skipped_reasons.get(reason, 0) + 1
                    self.logger.warning(f"第 {idx + 1} 行跳過: {reason}")
                    skipped_rows += 1
                    continue

                # 其他欄位都採用寬鬆處理，使用預設值填充而非跳過
                warning_fields = []
                for field in required_fields:
                    if field != "QuestionInChinese" and (
                        field not in df.columns or pd.isna(row.get(field))
                    ):
                        warning_fields.append(field)

                # 只記錄警告，但仍處理該題目
                if warning_fields:
                    self.logger.warning(
                        f"第 {idx + 1} 行警告: 欄位 {', '.join(warning_fields)} 為空，使用預設值處理"
                    )

                # 識別正確答案
                correct_answer = row.get("CorrectAnswer", "")
                if isinstance(correct_answer, str) and correct_answer.upper() in [
                    "A",
                    "B",
                    "C",
                    "D",
                ]:
                    letter_to_option = {
                        "A": "AnswerAInChinese",
                        "B": "AnswerBInChinese",
                        "C": "AnswerCInChinese",
                        "D": "AnswerDInChinese",
                    }
                    option_field = letter_to_option[correct_answer.upper()]
                    if option_field in df.columns and not pd.isna(
                        row.get(option_field)
                    ):
                        correct_answer_text = str(row[option_field])
                    else:
                        correct_answer_text = f"選項 {correct_answer.upper()}"
                else:
                    correct_answer_text = str(correct_answer) if correct_answer else ""

                # 安全獲取欄位值，對於缺失的欄位使用預設值
                def safe_get(field_name: str, default: str = "") -> str:
                    if field_name in df.columns and not pd.isna(row.get(field_name)):
                        return str(row.get(field_name)).strip()
                    return default

                # 構建題目資料
                # question = {
                #     "question_no": safe_get("QuestionNo.", str(idx + 1)),
                #     "chapter_no": safe_get("ChapterNo", "未分類"),
                #     "question_text": str(row["QuestionInChinese"]).strip(),
                #     "option_a": safe_get("AnswerAInChinese", "選項 A"),
                #     "option_b": safe_get("AnswerBInChinese", "選項 B"),
                #     "option_c": safe_get("AnswerCInChinese", "選項 C"),
                #     "option_d": safe_get("AnswerDInChinese", "選項 D"),
                #     "correct_answer": correct_answer_text,
                #     "explanation": safe_get("AnswerExplainInChinese", "無解釋"),
                #     "picture": None,
                # }
                temp_question = ValidatedQuestionModel(
                    question_no=int(safe_get("QuestionNo.", str(idx + 1))),
                    chapter_no=safe_get("ChapterNo", "未分類"),
                    question_text=str(row["QuestionInChinese"]).strip(),
                    option_a=safe_get("AnswerAInChinese", "選項 A"),
                    option_b=safe_get("AnswerBInChinese", "選項 B"),
                    option_c=safe_get("AnswerCInChinese", "選項 C"),
                    option_d=safe_get("AnswerDInChinese", "選項 D"),
                    correct_answer=correct_answer_text,
                    explanation=safe_get("AnswerExplainInChinese", "無解釋"),
                    picture=None,
                )

                # 驗證並修正題目資料
                question = validate_and_fix_question(temp_question, idx)

                # 從提取的圖片中關聯題目與圖片
                chapter_no = question.chapter_no
                question_no = question.question_no
                unique_id = f"{chapter_no}_{question_no}"

                # 查找對應的圖片
                for image_name, info in report.get("image_mappings", {}).items():
                    if info.get("unique_id") == unique_id:
                        # 從輸出目錄讀取圖片數據
                        image_path = extractor.output_dir / image_name
                        if image_path.exists():
                            with open(image_path, "rb") as img_file:
                                question.picture = img_file.read()
                            self.logger.info(
                                f"題目 {chapter_no}.{question_no} 已關聯圖片 {image_name}, 大小: {question.picture.__sizeof__()} 位元組"
                            )
                            break

                # 檢查圖片是否成功處理
                if question.picture is not None:
                    self.logger.info(
                        f"題目 {question.question_no} 成功添加圖片，大小: {question.picture.__sizeof__()} 位元組"
                    )
                else:
                    self.logger.info(f"題目 {question.question_no} 沒有圖片")

                # 輸出調試信息，檢查每個題目的欄位
                # logged
                # self.logger.info(
                #     f"成功解析題目 {question['question_no']}: {question['question_text'][:30]}... 選項: A={question['option_a'][:10]}..., B={question['option_b'][:10]}..., C={question['option_c'][:10]}..., D={question['option_d'][:10]}..., 答案: {question['correct_answer'][:30]}..."
                # )

                questions.append(question)
                valid_rows += 1

            # 清理臨時目錄
            try:
                if extractor.output_dir.exists():
                    shutil.rmtree(extractor.output_dir)
                os.unlink(temp_file_path)
            except Exception as e:
                self.logger.warning(f"清理臨時文件時發生錯誤: {str(e)}")

            # 處理結果統計
            self.logger.info(
                f"Excel 解析結果: 總計 {total_rows} 行, 有效 {valid_rows} 行, 跳過 {skipped_rows} 行"
            )
            if skipped_rows > 0:
                for reason, count in skipped_reasons.items():
                    self.logger.info(f"- 跳過原因 '{reason}': {count} 行")

            return questions

        except Exception as e:
            self.logger.error(f"解析 Excel 檔案時發生錯誤: {str(e)}", exc_info=True)
            raise e


excel_client = ExcelHandler()
