import { createClient } from "redis";
import { Course } from "../models/course";
import { Department } from "../models/department";
import { Name } from "../models/name";
import { CoursesApiParameters, CoursesApiResponse } from "../pages/api/courses";
import { dataKey, hasName } from "./helpers";

const client = createClient({
  url: `redis://${process.env.REDIS_HOST}`,
});
client.on("error", (err) => console.log("Redis Client Error", err));
client.connect();

export const cacheCourses = async (
  params: CoursesApiParameters,
  courses: Course[],
  time: string
) => {
  const key = JSON.stringify({
    data: "courses",
    ...params,
  });
  await client.set(key, JSON.stringify({ courses, time }));
};

export const getCachedCourses = async (
  params: CoursesApiParameters
): Promise<CoursesApiResponse | undefined> => {
  const key = JSON.stringify({
    data: "courses",
    ...params,
  });
  const cached = await client.get(key);
  if (cached) {
    return JSON.parse(cached);
  } else {
    return undefined;
  }
};

export const cacheCourseNames = async (acysem: string, courses: Course[]) => {
  // get course names
  const courseNameKey = dataKey(acysem, "courseName");
  let courseNames: Name[] = [];
  const rawCourseNames = await client.get(courseNameKey);
  if (rawCourseNames !== null) {
    courseNames = JSON.parse(rawCourseNames);
  }

  // get teacher names
  const teacherNameKey = dataKey(acysem, "teacherName");
  let teacherNames: Name[] = [];
  const rawTeacherNames = await client.get(teacherNameKey);
  if (rawTeacherNames !== null) {
    teacherNames = JSON.parse(rawTeacherNames);
  }

  for (const course of courses) {
    if (!hasName(courseNames, course.name)) {
      courseNames.push(course.name);
    }
    const teachers = course.teacher.split(/,|、/);
    for (const teacher of teachers) {
      // * there is only chinese teacherName at the moment
      const newTeacher: Name = { "zh-tw": teacher };
      if (!hasName(teacherNames, newTeacher)) {
        teacherNames.push(newTeacher);
      }
    }
  }

  await client.set(courseNameKey, JSON.stringify(courseNames));
  await client.set(teacherNameKey, JSON.stringify(teacherNames));
};

export const cacheDepartments = async (
  departmentsZh: Department[],
  departmentsEn: Department[]
) => {
  const departments = {
    "zh-tw": departmentsZh,
    "en-us": departmentsEn,
  };
  const departmentNames = {
    "zh-tw": departmentsZh.map((department) => department.name),
    "en-us": departmentsEn.map((department) => department.name),
  };
  await client.set("departments", JSON.stringify(departments));
  await client.set("departmentNames", JSON.stringify(departmentNames));
};

export const getCachedCourseNames = async (
  acysem: string,
  language: string
): Promise<string[]> => {
  let courseNames: Name[] = [];
  const rawCourseNames = await client.get(dataKey(acysem, "courseName"));
  if (rawCourseNames !== null) {
    courseNames = JSON.parse(rawCourseNames);
  }
  return courseNames.map((name) => name[language]);
};

export const getCachedTeacherNames = async (
  acysem: string,
  language: string
): Promise<string[]> => {
  let teacherNames: Name[] = [];
  const rawTeacherNames = await client.get(dataKey(acysem, "teacherName"));
  if (rawTeacherNames !== null) {
    teacherNames = JSON.parse(rawTeacherNames);
  }
  return teacherNames.map((name) => name[language]);
};
