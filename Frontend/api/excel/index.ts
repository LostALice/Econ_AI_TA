// Code by wonmeow
// Modify by AkinoAlice @TyrantRey 3 / 8 / 2025

import { IDocsFormat, IExcelQuestion } from "@/types/global";
import { siteConfig } from "@/config/site";
import { fetcher } from "../fetcher";

/**
 * 取得文件列表
 * @param docType 文件類型 (TESTING 或 THEOREM)
 * @returns 文件列表
 */
export async function fetchExcelFileList(docType: string): Promise<IDocsFormat[]> {
    try {
        const response = await fetcher(`${siteConfig.api_url}/excel/list/${docType}/`, {
            method: "GET",
        });

        const data = await response
        const docsList = data.docs_list || [];

        // 將 API 返回的資料映射到 IDocsFormat 型別，確保一致性處理
        return docsList.map((doc: any) => {
            // 確定時間戳字段
            const updateTime = doc.last_update || doc.lastUpdate || new Date().toISOString();
            const uploadTime = doc.upload_time || doc.uploadTime || updateTime;

            return {
                fileID: doc.file_id || doc.fileID,
                fileName: doc.file_name || doc.fileName,
                docType: doc.doc_type || doc.docType || docType,
                lastUpdate: updateTime,
                uploadTime: uploadTime,
                questionCount: doc.question_count || doc.questionCount || 0
            };
        });
    } catch (error) {
        console.error("Error fetching Excel file list:", error);
        throw error;
    }
}

/**
 * 上傳 Excel 文件
 * @param file Excel 檔案
 * @param docType 文件類型 (TESTING 或 THEOREM)
 * @returns 上傳成功的檔案資訊
 */
export async function uploadExcelFile(
    file: File,
    docType: string
): Promise<{
    file_id: string;
    file_name: string;
    last_update: string;
}> {
    try {
        const formData = new FormData();
        formData.append("excel_file", file);
        formData.append("doc_type", docType);

        console.log(`正在上傳檔案: ${file.name}, 類型: ${docType}, 大小: ${file.size} bytes`);

        const response = await fetch(`${siteConfig.api_url}/excel/upload/`, {
            method: "POST",
            body: formData,
        });

        console.log(response)
        if (!response.ok) {
            const errorText = await response.text();
            console.error("上傳檔案失敗:", errorText);
            throw new Error(`Server responded with status: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        console.log("上傳成功，伺服器回應:", data);

        return {
            file_id: data.file_id,
            file_name: data.file_name,
            last_update: data.last_update
        };
    } catch (error) {
        console.error("Error uploading Excel file:", error);
        throw error;
    }
}

/**
 * 取得題目列表
 * @param fileId 檔案ID
 * @returns 題目列表和檔案資訊
 */
export async function fetchExcelQuestions(fileId: string): Promise<{
    file_id: string;
    file_name: string;
    questions: IExcelQuestion[];
}> {
    try {
        console.log(`正在獲取檔案 ID: ${fileId} 的題目列表`);

        const response = await fetcher(`${siteConfig.api_url}/excel/questions/${fileId}/`, {
            method: "GET",
        });

        const data = await response

        // 處理題目圖片，支援一題多圖的情況
        if (data.questions && Array.isArray(data.questions)) {
            // 將單張圖片轉換為圖片陣列格式，保持向後兼容性
            data.questions = data.questions.map((question: any) => {
                if (question.picture) {
                    // 確保 picture 屬性總是字串或字串陣列
                    if (Array.isArray(question.picture)) {
                        // 已經是陣列，確保所有元素都是有效的
                        question.pictures = question.picture.filter((pic: any) => pic);
                        question.picture = question.pictures[0] || null;
                    } else {
                        // 單一圖片，轉換為陣列格式
                        question.pictures = [question.picture];
                    }
                } else {
                    question.pictures = [];
                }
                return question;
            });
        }

        console.log(`成功獲取 ${data.questions?.length || 0} 個題目，包含 ${data.questions?.filter((q: any) => q.picture).length || 0} 個帶圖片的題目`);

        return {
            file_id: data.file_id,
            file_name: data.file_name,
            questions: data.questions || []
        };
    } catch (error) {
        console.error("Error fetching Excel questions:", error);
        throw error;
    }
}

/**
 * 刪除文件
 * @param fileId 檔案ID
 * @returns 刪除結果
 */
export async function deleteExcelFile(fileId: string): Promise<{
    file_id: string;
    message: string;
}> {
    try {
        console.log(`正在刪除檔案 ID: ${fileId}`);

        const response = await fetcher(`${siteConfig.api_url}/excel/${fileId}/`, {
            method: "DELETE",
        });

        const data = await response
        console.log("刪除成功，伺服器回應:", data);

        return {
            file_id: data.file_id,
            message: data.message
        };
    } catch (error) {
        console.error("Error deleting Excel file:", error);
        throw error;
    }
}

/**
 * 更新題目
 * @param fileId 檔案ID
 * @param questions 更新後的題目列表
 * @returns 更新結果
 */
export async function updateExcelQuestions(
    fileId: string,
    questions: IExcelQuestion[]
): Promise<{
    file_id: string;
    updated_count: number;
    deleted_count: number;
    message: string;
}> {
    try {
        console.log(`正在更新檔案 ID: ${fileId} 的題目，共 ${questions.length} 個題目`);

        // 處理題目中的圖片，確保 Base64 格式正確
        const processedQuestions = questions.map(question => {
            const { picture, pictures, ...rest } = question as any;

            // 處理主圖片（向後兼容）
            let processedPicture = null;
            if (picture && typeof picture === 'string' && picture.includes('base64')) {
                processedPicture = picture;
            }

            // 處理多張圖片
            let processedPictures = [];
            if (pictures && Array.isArray(pictures)) {
                processedPictures = pictures.filter(pic => pic && typeof pic === 'string' && pic.includes('base64'));
            }

            // 返回處理後的題目，保留原始的單圖片和多圖片格式
            return {
                ...rest,
                picture: processedPicture,
                pictures: processedPictures
            };
        });

        const response = await fetcher(`${siteConfig.api_url}/excel/questions/`, {
            method: "PUT",
            body: JSON.stringify({
                file_id: fileId,
                questions: processedQuestions
            }),
        });

        const data = await response
        console.log("更新成功，伺服器回應:", data);

        return {
            file_id: data.file_id,
            updated_count: data.updated_count,
            deleted_count: data.deleted_count,
            message: data.message
        };
    } catch (error) {
        console.error("Error updating Excel questions:", error);
        throw error;
    }
}