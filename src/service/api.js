import axios from "axios";
import { backendUrl, storage } from "../common/Common";
import { navigate } from "./hook/navigationRef";
import CustomToast from "./hook/Toast/CustomToast";
let isNavigate = false;
let isNetworkErrorShown = false; // ⬅️ Add this flag

const triggerNetworkErrorFunction = () => {
  if (!isNetworkErrorShown) {
    isNetworkErrorShown = true;
    CustomToast.show(
      "Network Error. Please check your internet connection.", true,
      3000
    );
    // Reset the flag after a delay (same as toast duration)
    setTimeout(() => {
      isNetworkErrorShown = false;
    }, 10000);
  }
};
const api = axios.create({
  baseURL: backendUrl,
  timeout: 100000,
  headers: {
    "Content-Type": "application/json",
    Accept: ["application/json", "multipart/form-data"],
  },
});
api.interceptors.request.use(
  (config) => {
    const token = storage.getString("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    if (!error.response) {
      triggerNetworkErrorFunction();
    }

    const { response } = error;
    if (response && response.status === 401) {
      if (!isNavigate) {
        navigate("Logout");
        isNavigate = true;
      }
    }
    console.log(error?.response);

    return Promise.reject(error);
  }
);

export default api;