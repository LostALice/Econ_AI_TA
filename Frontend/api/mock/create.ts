// Code by AkinoAlice@TyrantRey

import { siteConfig } from "@/config/site";

import {
  TExamType,
  IExamsModel,
  IQuestionModel,
  IQuestionImageBase64Model,
  IOptionModel,
  IClassListModel,
  IExamSubmissionModel
} from "@/types/mock/create";
import { fetcher } from "../fetcher";



export async function fetchClassList(): Promise<IClassListModel[]> {
  try {
    const resp = await fetcher(siteConfig.api_url + `/management/class-list/user-id/`, { method: "GET" });
    console.log(resp)
    return resp as IClassListModel[]
  }
  catch (err) {
    console.error(err)
    return []
  }
}

export async function fetchExamLists(examType: TExamType): Promise<IExamsModel[]> {
  try {
    const resp = await fetcher(siteConfig.api_url + `/mock/exam/${examType}`, { method: "GET" });
    console.log(resp)
    return resp as IExamsModel[]
  }
  catch (err) {
    console.error(err)
    return []
  }
}
export async function fetchExamInfo(examId: number): Promise<IExamsModel | null> {
  try {
    const resp = await fetcher(siteConfig.api_url + `/mock/info/${examId}/exam/`, { method: "GET" });
    console.log(resp)
    return resp as IExamsModel
  }
  catch (err) {
    console.log(err)
    return null
  }
}
export async function fetchExamQuestion(examId: number): Promise<IQuestionModel[]> {
  try {
    const resp = await fetcher(siteConfig.api_url + `/mock/exam/${examId}/question/`, { method: "GET" });
    console.log(resp)
    return resp as IQuestionModel[]
  }
  catch (err) {
    console.log(err)
    return []
  }
}
export async function fetchExamQuestionOption(examId: number, questionId: number): Promise<IOptionModel[]> {
  try {
    const resp = await fetcher(siteConfig.api_url + `/mock/exam/${examId}/question/${questionId}/option/`, { method: "GET" });
    console.log(resp)
    return resp as IOptionModel[]
  }
  catch (err) {
    console.log(err)
    return []
  }
}
export async function fetchExamQuestionImage(examId: number, questionId: number): Promise<IQuestionImageBase64Model[]> {
  try {
    const resp = await fetcher(siteConfig.api_url + `/mock/exam/${examId}/question/${questionId}/image/`, { method: "GET" });
    console.log(resp)
    return resp as IQuestionImageBase64Model[]
  }
  catch (err) {
    console.log(err)
    return []
  }
}

export async function createExam(
  class_id: number,
  exam_name: string,
  exam_type: TExamType,
  exam_date: string,
  exam_duration: number): Promise<number | null> {
  try {
    const resp = await fetcher(siteConfig.api_url + "/mock/new/exam/", {
      method: "POST",
      body: JSON.stringify({
        class_id: class_id,
        exam_name: exam_name,
        exam_type: exam_type,
        exam_date: exam_date,
        exam_duration: exam_duration,
      })
    });
    console.log(resp)
    return resp as number
  }
  catch (err) {
    console.log(err)
    return null
  }
}

export async function createExamQuestion(
  exam_id: number,
  question_text: string,
): Promise<number | null> {
  try {
    const resp = await fetcher(
      siteConfig.api_url + `/mock/new/exam/${exam_id}/question/?` +
      new URLSearchParams({ question_text: question_text }), {
      method: "POST",
    });
    console.log(resp)
    return resp as number
  }
  catch (err) {
    console.log(err)
    return null
  }
}

export async function createExamQuestionOption(
  exam_id: number,
  question_id: number,
  option_text: string,
  is_correct: boolean
): Promise<number | null> {
  try {
    const resp = await fetcher(
      siteConfig.api_url + `/mock/new/exam/${exam_id}/question/${question_id}/option/`, {
      method: "POST",
      body: JSON.stringify({
        option_text: option_text,
        is_correct: is_correct,
      }),
    });
    console.log(resp)
    return resp as number
  }
  catch (err) {
    console.log(err)
    return null
  }
}

export async function createExamQuestionImage(
  exam_id: number,
  question_id: number,
  base64_image: string,
): Promise<string | null> {
  try {
    const resp = await fetcher(
      siteConfig.api_url + `/mock/new/exam/${exam_id}/question/${question_id}/image/`,
      {
        method: "POST",
        body: JSON.stringify({
          base64_image: base64_image,
        }),
      });
    console.log(resp)
    return resp as string
  }
  catch (err) {
    console.log(err)
    return null
  }
}

export async function modifyExam(
  exam_id: number,
  class_id: number,
  exam_name: string,
  exam_type: TExamType,
  exam_date: string,
  exam_duration: number
): Promise<boolean> {
  try {
    const resp = await fetcher(siteConfig.api_url + `/modify/exam/${exam_id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        exam_id: exam_id,
        class_id: class_id,
        exam_name: exam_name,
        exam_type: exam_type,
        exam_date: exam_date,
        exam_duration: exam_duration,
      })
    });
    console.log(resp)
    return true
  }
  catch (error) {
    console.error(error)
    return false
  }
}

export async function modifyExamQuestion(
  exam_id: number,
  question_id: number,
  question_text: string
): Promise<boolean> {
  try {
    const resp = await fetcher(
      siteConfig.api_url + `/mock/modify/exam/${exam_id}/question/${question_id}/?` +
      new URLSearchParams({ question_text: question_text }), {
      method: "PATCH",
    });
    console.log(resp)
    return true
  }
  catch (error) {
    console.error(error)
    return false
  }
}
export async function modifyExamQuestionOption(
  exam_id: number,
  question_id: number,
  option_id: number,
  option_text: string,
  is_correct: boolean
): Promise<boolean> {
  try {
    const resp = await fetcher(
      siteConfig.api_url + `/mock/modify/exam/${exam_id}/question/${question_id}/option/${option_id}/`, {
      method: "PATCH",
      body: JSON.stringify({
        option_text: option_text,
        is_correct: is_correct
      })
    });
    console.log(resp)
    return true
  }
  catch (error) {
    console.error(error)
    return false
  }
}
export async function modifyExamQuestionImage(
  exam_id: number,
  question_id: number,
  image_uuid: string,
  base64_image: string
): Promise<boolean> {
  try {
    const resp = await fetcher(siteConfig.api_url + `/mock/modify/exam/${exam_id}/question/${question_id}/image/${image_uuid}/`, {
      method: "PATCH",
      body: JSON.stringify({
        base64_image: base64_image
      })
    });
    console.log(resp)
    return true
  }
  catch (error) {
    console.error(error)
    return false
  }
}

export async function deleteExam(exam_id: number): Promise<boolean> {
  try {
    const resp = await fetcher(
      siteConfig.api_url + `/mock/disable/exam/${exam_id}/`, {
      method: "PATCH",
    })
    console.log(resp)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
export async function deleteExamQuestion(exam_id: number, question_id: number): Promise<boolean> {
  try {
    const resp = await fetcher(
      siteConfig.api_url + `/mock/disable/exam/${exam_id}/question/${question_id}/`, {
      method: "PATCH",
    })
    console.log(resp)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
export async function deleteExamQuestionOption(
  exam_id: number,
  question_id: number,
  option_id: number
): Promise<boolean> {
  try {
    const resp = await fetcher(
      siteConfig.api_url + `/mock/disable/exam/${exam_id}/question/${question_id}/option/${option_id}/`, {
      method: "PATCH",
    })
    console.log(resp)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
export async function deleteExamQuestionImage(
  exam_id: number,
  question_id: number,
  image_uuid: string
): Promise<boolean> {
  try {
    const resp = await fetcher(
      siteConfig.api_url + `/mock/disable/exam/${exam_id}/question/${question_id}/image/${image_uuid}/`, {
      method: "PATCH",
    })
    console.log(resp)
    return true
  } catch (error) {
    console.error(error)
    return false
  }
}
export async function submitExam(submit_exam: IExamSubmissionModel): Promise<number | null> {
  try {
    const resp = await fetcher(
      siteConfig.api_url + `/mock/submit/`, {
      method: "POST",
      body: JSON.stringify({
        exam_id: submit_exam.exam_id,
        submission_date: submit_exam.submission_date,
        answer: submit_exam.answer,
      })
    })
    console.log(resp)
    return resp as number
  }
  catch (error) {
    console.log(error)
    return null
  }
}
// export async function createNewExam(
//   exam: ICreateNewExamPrams
// ): Promise<IExamsInfo> {
//   const resp = await fetcher(siteConfig.api_url + "/mock/new/exam/", {
//     method: "POST",
//     body: JSON.stringify(exam),
//   });

//   return resp;
// }

// export async function updateExam(exam: IExamsInfo) {
//   const resp = await fetcher(siteConfig.api_url + "/mock/modify/exam/", {
//     method: "POST",
//     body: JSON.stringify(exam),
//   });

//   return resp;
// }

// export async function deleteExam(examId: number) {
//   const resp = await fetcher(siteConfig.api_url + "/mock/delete/exam/", {
//     method: "DELETE",
//     body: JSON.stringify({ exam_id: examId }),
//   });

//   return resp;
// }

// export async function createNewQuestion(question: ICreateNewQuestionPrams) {
//   const resp = await fetcher(siteConfig.api_url + "/mock/new/question/", {
//     method: "POST",
//     body: JSON.stringify(question),
//   });

//   return resp;
// }

// export async function createNewOptions(
//   options: ICreateNewQuestionOptionsPrams[]
// ): Promise<IExamOption[]> {
//   console.log(options);
//   const resp = await fetcher(siteConfig.api_url + "/mock/new/options/", {
//     method: "POST",


//     body: JSON.stringify(options),
//   });

//   return resp;
// }

// export async function modifyQuestion(
//   question: IExamQuestion
// ): Promise<boolean> {
//   const resp = await fetcher(siteConfig.api_url + "/mock/modify/question/", {
//     method: "PUT",
//     body: JSON.stringify(question),
//   });

//   return resp;
// }

// export async function deleteQuestion(questionId: number) {
//   const resp = await fetcher(
//     siteConfig.api_url + "/mock/delete/question/" + questionId,
//     {
//       method: "DELETE",
//       headers: {
//         "Content-Type": "application/json",
//       },

//     }
//   );

//   return resp;
// }
