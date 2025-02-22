import { APP_API_URL } from "~/config";
import type { Method, Options } from "./request";
import { request } from "./request";

interface Config<P> {
  method: Method;
  params?: P;
  data?: string | object;
  options?: Options;
}

 class Api {
  private readonly api: ReturnType<typeof request.create>;

  constructor(baseUrl: string) {
    this.api = request.create(baseUrl);
  }

  async fetcher<T, P extends object = object>(
    url: string,
    config: Config<P>,
  ): Promise<T> {
    const signature = await SdkService.sign("auth");
    const { data } = await this.api<T>(
      url,
      {
        headers: {
          ...config.options?.headers,
          Signature: JSON.stringify(signature),
        },
        ...config.options,
      },
      config.method,
      config.data,
    );
    return data;
  }
}

export const api = new Api(APP_API_URL)
