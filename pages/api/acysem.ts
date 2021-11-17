import type { NextApiRequest, NextApiResponse } from "next";
import { cachedGet } from "../../utils/redis";

type Data = {
  acysems: string[];
  time: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === "GET") {
    const { acysems, time } = await getAcySem();
    // console.log(acysems);
    if (typeof acysems !== "undefined") {
      res.status(200).json({
        acysems,
        time,
      });
    } else {
      res.status(500).end();
    }
  }

  res.status(405).end();
}

type GetAcySemReponse = {
  acysems?: string[] | undefined;
  time: string;
};

async function getAcySem(): Promise<GetAcySemReponse> {
  const { data, time } = await cachedGet(
    process.env.NYCU_ENDPOINT + "get_acysem"
  );
  console.log(data);
  if (data) {
    const acysems = data.map((acysem: { T: string }): string => acysem["T"]);
    return { acysems, time };
  } else {
    return { time };
  }
}
