import { SearchCategory } from "../models/search_category";

export const toAcysemText = (acysem: string, language: string): string => {
  const acy = acysem.slice(0, 3);
  const sem = acysem.slice(3, 4);

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
    return "Course Name";
  }
  if (category === "teacherName") {
    return "Teacher Name";
  }
  if (category === "departmentName") {
    return "Department";
  }
  if (category === "courseId") {
    return "Course ID";
  }
  if (category === "coursePermanentId") {
    return "Permanent ID";
  }
  return "";
};
