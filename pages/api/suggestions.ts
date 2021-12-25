import Fuse from "fuse.js";
import Joi from "joi";
import type { NextApiRequest, NextApiResponse } from "next";
import { getCachedCourseNames, getCachedTeacherNames } from "../../utils/redis";

export type SuggestionsApiParameters = {
  category: string;
  query: string;
  language: string;
};

const schema = Joi.object<SuggestionsApiParameters>({
  category: Joi.string().required().valid("courseName", "teacherName"),
  query: Joi.string().required(),
  language: Joi.string().default("zh-tw"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // validate request
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

  let cached: string[] = [];
  switch (params.value.category) {
    case "courseName":
      cached = await getCachedCourseNames(params.value.language);
      break;
    case "teacherName":
      cached = await getCachedTeacherNames();
      break;
  }

  const fuse = new Fuse(cached);
  const suggestions = fuse
    .search(params.value.query)
    .map((e) => e.item)
    .slice(0, parseInt(process.env.NEXT_PUBLIC_RECOMMENDATION_COUNT!));
  res.status(200).json(suggestions);
}
