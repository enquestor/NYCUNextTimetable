import type { NextApiRequest, NextApiResponse } from "next";
import { Course } from "../../models/course";
import { cacheCourseNames, cacheCourses } from "../../utils/redis";
import Joi from "joi";
import { getCourses } from "../../utils/nycuapi";
import Fuse from "fuse.js";

export type CoursesApiParameters = {
  acysem: string;
  category: string;
  query: string;
  language: string;
};

export type CoursesApiResponse = {
  courses: Course[];
  time: string;
};

const schema = Joi.object<CoursesApiParameters>({
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
});

export default async function (req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  // validate request
  let params = schema.validate(req.body);
  if (
    typeof params.value === "undefined" ||
    typeof params.error !== "undefined"
  ) {
    res.status(400).json(params.error?.message);
    return;
  }

  const result = await getCourses({
    acysem: params.value.acysem,
    option: toNycuOption(params.value.category),
    query: params.value.query,
  });
  if (typeof result === "undefined") {
    res.status(500).end();
    return;
  }

  const { courses, time } = result;
  let sortedCourses = courses;
  if (params.value.category !== "departmentName") {
    const fuse = new Fuse(courses, {
      keys: [["name", params.value.language]],
    });
    sortedCourses = fuse.search(params.value.query).map((e) => e.item);
  }

  cacheCourses(params.value, sortedCourses, time);
  cacheCourseNames(params.value.acysem, sortedCourses);

  res.status(200).json({ sortedCourses, time });
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
