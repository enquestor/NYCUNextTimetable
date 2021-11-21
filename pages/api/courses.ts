import type { NextApiRequest, NextApiResponse } from "next";
import { Course } from "../../models/course";
import {
  cacheCourses,
  cachedPost,
  getCachedDepartments,
} from "../../utils/redis";
import { parseCourses } from "../../models/course";
import { encode } from "querystring";
import { NycuCoursesApiReponse } from "../../models/nycu_courses_api_response";

export type CoursesApiParameters = {
  acysem: string;
  category: string;
  query: string;
  language?: string;
  force?: boolean;
};

export type CoursesApiResponse = {
  courses: Course[];
  time: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CoursesApiResponse>
) {
  // validate request
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  const params = req.body as CoursesApiParameters;
  const acysem = params.acysem;
  const category = params.category;
  const query = params.query;
  const language = params.language ?? "zh-tw";
  const force = params.force ?? false;
  if (
    typeof acysem !== "string" ||
    typeof category !== "string" ||
    typeof query !== "string" ||
    (language !== "zh-tw" && language !== "en-us")
  ) {
    res.status(400).end();
    return;
  }
  const nycuOption = toNycuOption(category);
  if (nycuOption === "") {
    res.status(400).end();
    return;
  }

  // format query parameters
  let nycuParameter = query;
  if (nycuOption === "dep") {
    nycuParameter = await toDepartmentId(query, language);
  }

  // get courses from nycu
  const { data, time } = await nycuCoursesApi(
    acysem,
    nycuOption,
    nycuParameter,
    force
  );
  if (data === null) {
    res.status(500).end();
    return;
  }
  const courses = parseCourses(data!);

  // cache course details
  cacheCourses(courses);

  res.status(200).json({ courses, time });
}

function toNycuOption(category: string): string {
  switch (category) {
    case "courseName":
      return "crsname";
    case "teacherName":
      return "teaname";
    case "departmentName":
      return "dep";
    case "courseId":
      return "cos_id";
    case "coursePermanentId":
      return "cos_code";
  }
  return "";
}

type CachedNycuCoursesApiReponse = {
  data?: NycuCoursesApiReponse | null;
  time: string;
};

async function toDepartmentId(
  departmentName: string,
  language: string
): Promise<string> {
  const departments = await getCachedDepartments(language);
  const target = departments.find((department) =>
    department.name.includes(departmentName)
  );
  if (typeof target === "undefined") {
    return "";
  } else {
    return target.id;
  }
}

async function nycuCoursesApi(
  acysem: string,
  option: string,
  parameter: string,
  force: boolean
): Promise<CachedNycuCoursesApiReponse> {
  const acy = acysem.substr(0, 3);
  const sem = acysem.slice(-1);
  const response = await cachedPost(
    process.env.NEXT_PUBLIC_NYCU_ENDPOINT + "get_cos_list",
    encode({
      m_acy: acy,
      m_sem: sem,
      m_acyend: acy,
      m_semend: sem,
      m_dep_uid: option === "dep" ? parameter : "**",
      m_group: "**",
      m_grade: "**",
      m_class: "**",
      m_option: option === "dep" ? "**" : option,
      m_crsname: option === "crsname" ? parameter : "**",
      m_teaname: option === "teaname" ? parameter : "**",
      m_cos_id: option === "cos_id" ? parameter : "**",
      m_cos_code: option === "cos_code" ? parameter : "**",
      m_crstime: "**",
      m_crsoutline: "**",
      m_costype: "**",
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    },
    force
  );
  return response;
}
