import axios, { AxiosRequestConfig } from "axios";
import { createClient } from "redis";

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
