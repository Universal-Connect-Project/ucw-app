import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";

const validateStatus = (status: number) => {
  return status >= 200 && status < 300;
};

const configuredAxios = axios.create({
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    // The 'Inter-x' headers are just for security to fingerprint requests.
    "x-inter-ua": navigator.userAgent,
    "x-inter-av": navigator.appVersion,
    "x-inter-platform": navigator.platform,
  },
  validateStatus,
});

let meta: object;

const successCallback = (response: AxiosResponse) => {
  if (response.headers.meta) {
    meta = response.headers.meta;
  }

  return response;
};

const requestCallback = (request: InternalAxiosRequestConfig) => {
  if (meta) {
    request.headers.meta = meta;
  }

  return request;
};

configuredAxios.interceptors.request.use(requestCallback);
configuredAxios.interceptors.response.use(successCallback);

export default configuredAxios;
