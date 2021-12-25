import { Name } from "./name";
import { NycuCoursesApiReponse } from "./nycu_courses_api_response";

export type Course = {
  year: number;
  semester: number;
  id: string;
  permanentId: string;
  limit: number;
  link: string;
  name: Name;
  credits: number;
  hours: number;
  memo: string;
  teacher: string;
  teacherLink: string;
  time: string;
  departmentId: string;
  registered: number;
  departmentName: Name;
  type: string;
  // typeInformation: {
  //     categoryoyName: {
  //         'zh-tw':  string
  //         'en-us':  string
  //     }
  //     eligible:     string
  // } | null
  typeInformation: string;
  language: string;
};

export function parseCourses(data: NycuCoursesApiReponse): Array<Course> {
  let courses: Array<Course> = [];
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
          link: apiCourse.URL ?? "",
          name: {
            "zh-tw": apiCourse.cos_cname,
            "en-us": apiCourse.cos_ename,
          },
          credits: parseFloat(apiCourse.cos_credit),
          hours: parseFloat(apiCourse.cos_hours),
          memo: apiCourse.memo ?? "",
          teacher: apiCourse.teacher,
          teacherLink: apiCourse.TURL,
          time: apiCourse.cos_time,
          departmentId: departmentId,
          registered: parseInt(apiCourse.reg_num),
          departmentName: {
            "zh-tw": apiCourse.dep_cname,
            "en-us": apiCourse.dep_ename,
          },
          type: apiCourse.cos_type,
          typeInformation: briefs.join("、"),
          language: data[departmentId].language[courseId].授課語言代碼,
        });
        courseIds.push(apiCourse.cos_id);
      }
    }
  }

  return courses;
}
