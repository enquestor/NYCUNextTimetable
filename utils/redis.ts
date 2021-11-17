import axios, { AxiosRequestConfig } from "axios";
import { createClient } from "redis";

const client = createClient({
  url: `redis://${process.env.REDIS_HOST}`,
});
client.on("error", (err) => console.log("Redis Client Error", err));
client.connect();

export async function cachedGet(
  url: string,
  config?: AxiosRequestConfig<any>,
  force?: boolean
): Promise<any> {
  const key = JSON.stringify({
    url,
    config: config,
  });

  if (force !== true) {
    const cached = await client.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  try {
    const response = await axios.get(url, config);
    await client.set(key, JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

export async function cachedPost(
  url: string,
  data?: any,
  config?: AxiosRequestConfig<any>,
  force?: boolean
): Promise<any> {
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
    await client.set(key, JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    console.log(error);
  }
}
