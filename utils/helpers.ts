import axios from "axios";
import { Course } from "../models/course";
import { Name } from "../models/name";
import { GetCoursesResponseData } from "./nycuapi";

export const separateAcysem = (acysem: string) => {
  const acy = acysem.slice(0, acysem.length - 1);
  const sem = acysem.slice(acysem.length - 1, acysem.length);
  return { acy, sem };
};

export const toAcysemText = (acysem: string, language: string): string => {
  const { acy, sem } = separateAcysem(acysem);
  let semText = "";
  if (language === "zh-tw") {
    if (sem === "1") {
      semText = "上";
    } else if (sem === "2") {
      semText = "下";
    } else if (sem === "X") {
      semText = "暑";
    }
  } else if (language === "en-us") {
    if (sem === "1") {
      semText = "Spring";
    } else if (sem === "2") {
      semText = "Fall";
    } else if (sem === "X") {
      semText = "Summer";
    }
  }

  return acy + " " + semText;
};

export const toCategoryText = (category: string, language: string): string => {
  if (category === "courseName") {
    // return "Course Name";
    return "課程名稱";
  }
  if (category === "teacherName") {
    // return "Teacher Name";
    return "教師名稱";
  }
  if (category === "departmentName") {
    // return "Department";
    return "科系/分類";
  }
  if (category === "courseId") {
    // return "Course ID";
    return "當期課號";
  }
  if (category === "coursePermanentId") {
    // return "Permanent ID";
    return "永久課號";
  }
  return "";
};

export const hasName = (names: Name[], target: Name): boolean => {
  const langs = Object.keys(target);
  for (const name of names) {
    for (const lang of langs) {
      if (name[lang] === target[lang]) {
        return true;
      }
    }
  }
  return false;
};

export const dataKey = (acysem: string, data: string): string => {
  return JSON.stringify({
    acysem,
    data,
  });
};

export const now = (): string => new Date().toISOString();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function slowPost(
  endpoint: string,
  params: string,
  config: Object
): Promise<any> {
  try {
    console.log("request");
    const response = await axios.post(
      process.env.NEXT_PUBLIC_NYCUAPI_ENDPOINT + endpoint,
      params,
      config
    );
    await sleep(parseInt(process.env.NYCUAPI_THROTTLE!));
    console.log(response.data);
    return response.data;
  } catch (error) {}
}

export function parseCourses(data: GetCoursesResponseData): Course[] {
  let courses: Course[] = [];
  let courseIds: string[] = [];

  for (const departmentId in data) {
    if (data[departmentId][1] !== null) {
      for (const courseId in data[departmentId][1]) {
        const apiCourse = data[departmentId][1]![courseId];
        if (courseIds.includes(apiCourse.cos_id)) {
          continue;
        }

        let briefs: Array<String> = [];
        for (const briefCode in data[departmentId].brief[courseId]) {
          briefs.push(data[departmentId].brief[courseId][briefCode].brief);
        }

        courses.push({
          year: parseInt(apiCourse.acy),
          semester: apiCourse.sem === "X" ? 3 : parseInt(apiCourse.sem),
          id: apiCourse.cos_id,
          permanentId: apiCourse.cos_code.trim(),
          limit: parseInt(apiCourse.num_limit),
          link: apiCourse.URL ?? undefined,
          name: {
            "zh-tw": apiCourse.cos_cname,
            "en-us": apiCourse.cos_ename,
          },
          credits: parseFloat(apiCourse.cos_credit),
          hours: parseFloat(apiCourse.cos_hours),
          memo: apiCourse.memo ?? undefined,
          teacher: apiCourse.teacher,
          teacherLink: apiCourse.TURL === "" ? undefined : apiCourse.TURL,
          time: apiCourse.cos_time,
          departmentId: departmentId,
          registered: parseInt(apiCourse.reg_num),
          departmentName: {
            "zh-tw": apiCourse.dep_cname,
            "en-us": apiCourse.dep_ename,
          },
          type: apiCourse.cos_type,
          typeInformation:
            briefs.join().trim() === "" ? undefined : briefs.join("、"),
          language: data[departmentId].language[courseId].授課語言代碼,
        });
        courseIds.push(apiCourse.cos_id);
      }
    }
  }

  return courses;
}
