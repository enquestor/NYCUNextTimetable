import axios, { AxiosRequestConfig } from "axios";
import { createClient } from "redis";
import { Course } from "../models/course";

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
  const rawCourseNamesZh = (await client.get("courseNamesZh")) ?? "[]";
  const rawCourseNamesEn = (await client.get("courseNamesEn")) ?? "[]";
  const rawTeacherNames = (await client.get("teacherNames")) ?? "[]";
  const courseNamesZh: string[] = JSON.parse(rawCourseNamesZh);
  const courseNamesEn: string[] = JSON.parse(rawCourseNamesEn);
  const teacherNames: string[] = JSON.parse(rawTeacherNames);
  for (const course of courses) {
    if (!courseNamesZh.includes(course.name["zh-tw"])) {
      courseNamesZh.push(course.name["zh-tw"]);
    }
    if (!courseNamesEn.includes(course.name["en-us"])) {
      courseNamesEn.push(course.name["en-us"]);
    }
    const teachers = course.teacher.split(/,|、/);
    for (const teacher of teachers) {
      if (!teacherNames.includes(teacher)) {
        teacherNames.push(teacher);
      }
    }
  }
  await client.set("courseNamesZh", JSON.stringify(courseNamesZh));
  await client.set("courseNamesEn", JSON.stringify(courseNamesEn));
  await client.set("teacherNames", JSON.stringify(teacherNames));
};

export const getCachedCourseNames = async (
  language: string
): Promise<string[]> => {
  if (language === "zh-tw") {
    const rawCourseNamesZh = (await client.get("courseNamesZh")) ?? "[]";
    const courseNamesZh: string[] = JSON.parse(rawCourseNamesZh);
    return courseNamesZh;
  } else if (language === "en-us") {
    const rawCourseNamesEn = (await client.get("courseNamesEn")) ?? "[]";
    const courseNamesEn: string[] = JSON.parse(rawCourseNamesEn);
    return courseNamesEn;
  }
  return [];
};

export const getCachedTeacherNames = async (): Promise<string[]> => {
  const rawTeacherNames = (await client.get("teacherNames")) ?? "[]";
  const teacherNames: string[] = JSON.parse(rawTeacherNames);
  return teacherNames;
};
