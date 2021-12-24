import type { NextApiRequest, NextApiResponse } from "next";
import { Course } from "../../models/course";
import { cacheCourses, cachedPost } from "../../utils/redis";
import { parseCourses } from "../../models/course";
import { encode } from "querystring";
import { NycuCoursesApiReponse } from "../../models/nycu_courses_api_response";
import Joi from "joi";
import { separateAcysem } from "../../utils/helpers";

export type CourseApiParameters = {
  acysem: string;
  category: string;
  query: string;
  language: string;
  force: boolean;
};

export type CoursesApiResponse = {
  courses: Course[];
  time: string;
};

const schema = Joi.object<CourseApiParameters>({
  acysem: Joi.string().required(),
  category: Joi.string()
    .required()
    .valid(
      "courseName",
      "teacherName",
      "departmentName",
      "courseId",
      "coursePermanentId"
    ),
  query: Joi.string().required(),
  language: Joi.string().default("zh-tw"),
  force: Joi.boolean().default(false),
});

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  let params = schema.validate(req.body);
  if (
    typeof params.value === "undefined" ||
    typeof params.error !== "undefined"
  ) {
    res.status(400).json(params.error?.message);
    return;
  }

  const nycuOption = toNycuOption(params.value.category);
  if (nycuOption === "") {
    res.status(400).end();
    return;
  }

  // get courses from nycu
  const { data, time } = await nycuCoursesApi(
    params.value.acysem,
    nycuOption,
    params.value.query,
    params.value.force
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

async function nycuCoursesApi(
  acysem: string,
  option: string,
  parameter: string,
  force: boolean
): Promise<CachedNycuCoursesApiReponse> {
  const { acy, sem } = separateAcysem(acysem);
  const response = await cachedPost(
    process.env.NEXT_PUBLIC_NYCUAPI_ENDPOINT + "get_cos_list",
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
      m_selcampus: "**",
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
