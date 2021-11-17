import type { NextApiRequest, NextApiResponse } from "next";
import { cachedGet } from "../../../utils/redis";

type Data = {
  departments: string[];
  time: string;
};
