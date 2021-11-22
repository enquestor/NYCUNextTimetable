export const toAcysemText = (acysem: string, language: string): string => {
  const acy = acysem.slice(0, acysem.length - 1);
  const sem = acysem.slice(acysem.length - 1, acysem.length);

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
    return "科系 / 分類";
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
