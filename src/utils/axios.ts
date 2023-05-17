import axios, { AxiosInstance } from "axios";

export const axiosInstanceWithoutToken = axios.create({ baseURL: process.env.REACT_APP_API_URI });

axiosInstanceWithoutToken.interceptors.request.use((config) => {
  /* ----------------------------- API Call Start ----------------------------- */
  /* eslint-disable no-console */
  console.log("[===== Started API Call =====]");
  // @ts-ignore
  config["headers"]["contentType"] = "application/json";
  return config;
});

axiosInstanceWithoutToken.interceptors.response.use((response) => {
  /* ------------------------------ API Call End ------------------------------ */
  console.log("[===== Ended API Call =====]");
  return response;
});

export const axiosInstance = axios.create({ baseURL: process.env.REACT_APP_API_URI });

axiosInstance.interceptors.request.use((config = {}) => {
  /* ----------------------------- API Call Start ----------------------------- */
  console.log("[===== Started API Call =====]", config);
  /* eslint-disable no-console */
  // @ts-ignore
  config["headers"]["authorization"] = `bearer ${localStorage.getItem("ACCESS_TOKEN")}`;
  // @ts-ignore
  config["headers"]["accept"] = "application/vnd.github.v3+json";
  return config;
});

axiosInstance.interceptors.response.use((response) => {
  /* ------------------------------ API Call End ------------------------------ */
  console.log("[===== Ended API Call =====]");
  return response;
});
