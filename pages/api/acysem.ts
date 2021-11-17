import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";
import { cachedGet } from "../../utils/redis";

type Data = string[];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === "GET") {
    const result = await getAcySem();
    if (result !== null) {
      res.status(200).json(result!);
    } else {
      res.status(500).end();
    }
  }

  res.status(405).end();
}

type GetAcySemReponse = string[];

async function getAcySem(): Promise<GetAcySemReponse | null> {
  const result = await cachedGet(process.env.NYCU_ENDPOINT + "get_acysem");
  if (result) {
    const acysems = result.map((acysem: { T: string }): string => acysem["T"]);
    return acysems;
  } else {
    return null;
  }
}
