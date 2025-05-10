import { IDocsFormat, IExcelQuestion } from "@/types/global";
import { siteConfig } from "@/config/site";

// 取得文件列表
export async function fetchExcelFileList(docType: string): Promise<IDocsFormat[]> {
  try {
    const response = await fetch(`${siteConfig.api_url}/excel/${docType}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status} ${response.statusText}`);
    }    const data = await response.json();
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

// 上傳 Excel 文件
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

    const response = await fetch(`${siteConfig.api_url}/excel/upload/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
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

// 取得題目列表
export async function fetchExcelQuestions(fileId: string): Promise<{
  file_id: string;
  file_name: string;
  questions: IExcelQuestion[];
}> {
  try {
    const response = await fetch(`${siteConfig.api_url}/excel/questions/${fileId}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
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

// 刪除文件
export async function deleteExcelFile(fileId: string): Promise<{
  file_id: string;
  message: string;
}> {
  try {
    const response = await fetch(`${siteConfig.api_url}/excel/${fileId}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return {
      file_id: data.file_id,
      message: data.message
    };
  } catch (error) {
    console.error("Error deleting Excel file:", error);
    throw error;
  }
}
