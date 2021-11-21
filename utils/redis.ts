import axios, { AxiosRequestConfig } from "axios";
import { createClient } from "redis";
import { Course } from "../models/course";
import { Department } from "../models/department";
import { getDepartments } from "./garbage_department_api";

const now = (): string => new Date().toISOString();

const client = createClient({
  url: `redis://${process.env.REDIS_HOST}`,
});
client.on("error", (err) => console.log("Redis Client Error", err));
client.connect();

type CachedResponse = {
  data: any;
  time: string;
};

export async function cachedGet(
  url: string,
  config?: AxiosRequestConfig<any>,
  force?: boolean
): Promise<CachedResponse> {
  const key = JSON.stringify({
    url,
    config,
  });

  if (force !== true) {
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  try {
    const response = await axios.get(url, config);
    const requestTime = now();
    await client.set(
      key,
      JSON.stringify({ data: response.data, time: requestTime })
    );
    return {
      data: response.data,
      time: requestTime,
    };
  } catch (error) {
    console.log(error);
    return {
      data: null,
      time: now(),
    };
  }
}

export async function cachedPost(
  url: string,
  data?: any,
  config?: AxiosRequestConfig<any>,
  force?: boolean
): Promise<CachedResponse> {
  const key = JSON.stringify({
    url,
    data,
    config,
  });

  if (force !== true) {
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  try {
    const response = await axios.post(url, data, config);
    const requestTime = now();
    await client.set(
      key,
      JSON.stringify({
        data: response.data,
        time: requestTime,
      })
    );
    return {
      data: response.data,
      time: requestTime,
    };
  } catch (error) {
    console.log(error);
    return {
      data: null,
      time: now(),
    };
  }
}

export const cacheCourses = async (courses: Course[]) => {
  let courseNames: { [key: string]: string[] } = {
    "zh-tw": [],
    "en-us": [],
  };
  const rawCourseNames = await client.get("courseNames");
  if (rawCourseNames !== null) {
    courseNames = JSON.parse(rawCourseNames);
  }
  const rawTeacherNames = (await client.get("teacherNames")) ?? "[]";
  const teacherNames: string[] = JSON.parse(rawTeacherNames);

  for (const course of courses) {
    if (!courseNames["zh-tw"].includes(course.name["zh-tw"])) {
      courseNames["zh-tw"].push(course.name["zh-tw"]);
    }
    if (!courseNames["en-us"].includes(course.name["en-us"])) {
      courseNames["en-us"].push(course.name["en-us"]);
    }
    const teachers = course.teacher.split(/,|、/);
    for (const teacher of teachers) {
      if (!teacherNames.includes(teacher)) {
        teacherNames.push(teacher);
      }
    }
  }

  await client.set("courseNames", JSON.stringify(courseNames));
  await client.set("teacherNames", JSON.stringify(teacherNames));
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
  language: string
): Promise<string[]> => {
  let courseNames: { [key: string]: string[] } = {
    "zh-tw": [],
    "en-us": [],
  };
  const rawCourseNames = await client.get("courseNames");
  if (rawCourseNames !== null) {
    courseNames = JSON.parse(rawCourseNames);
  }
  return courseNames[language];
};

export const getCachedTeacherNames = async (): Promise<string[]> => {
  const rawTeacherNames = (await client.get("teacherNames")) ?? "[]";
  const teacherNames: string[] = JSON.parse(rawTeacherNames);
  return teacherNames;
};

export const getCachedDepartments = async (
  language: string
): Promise<Department[]> => {
  const rawDepartments = await client.get("departments");
  if (rawDepartments === null) {
    return [];
  }
  const departments: { [key: string]: Department[] } =
    JSON.parse(rawDepartments);
  return departments[language];
};

export const getCachedDepartmentNames = async (
  language: string
): Promise<string[]> => {
  const rawDepartmentNames = await client.get("departmentNames");
  let departmentNames: { [key: string]: string[] } = {
    "zh-tw": [],
    "en-us": [],
  };
  if (rawDepartmentNames === null) {
    // Since Next.js doesn't provide an easy way to run server-side startup code, we get all departments on the first getCachedDepartmentNames call as a dirty hack
    const rawDepartments = await client.get("departments");
    if (rawDepartments === null) {
      // Mark departments as empty array to prevent getDepartments calls
      await client.set("departments", JSON.stringify([]));
      const acysem = process.env.NYCU_ACYSEM_FOR_DEPARTMENTS ?? "1101";
      console.log("Start Caching Departments ...");
      Promise.all([
        getDepartments(acysem, "zh-tw"),
        getDepartments(acysem, "en-us"),
      ]).then((result) => {
        cacheDepartments(result[0], result[1]);
        console.log("Finish Caching Departments.");
      });
    }
  } else {
    departmentNames = JSON.parse(rawDepartmentNames);
  }
  return departmentNames[language];
};
