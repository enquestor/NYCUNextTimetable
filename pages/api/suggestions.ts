import Fuse from "fuse.js";
import type { NextApiRequest, NextApiResponse } from "next";
import { getCachedCourseNames, getCachedTeacherNames } from "../../utils/redis";

export type SuggestionsApiParameters = {
  category: string;
  query: string;
  language?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string[]>
) {
  // validate request
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  const params = req.body as SuggestionsApiParameters;
  const category = params.category;
  const query = params.query;
  const language = params.language ?? "zh-tw";
  if (
    category !== "courseName" &&
    category !== "teacherName" &&
    category !== "departmentName"
  ) {
    res.status(400).end();
    return;
  }
  if (
    category === "courseName" &&
    language !== "zh-tw" &&
    language !== "en-us"
  ) {
    res.status(400).end();
    return;
  }

  let cached: string[] = [];
  if (category === "courseName") {
    cached = await getCachedCourseNames(language);
  } else if (category === "teacherName") {
    cached = await getCachedTeacherNames();
  }
  const fuse = new Fuse(cached);
  const suggestions = fuse
    .search(query)
    .map((e) => e.item)
    .slice(0, 5);
  res.status(200).json(suggestions);
}
