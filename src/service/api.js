// api/axios.js
import axios from 'axios';
import {navigate} from './hook/navigationRef';
import {ToastAndroid, Platform, Alert} from 'react-native';
import {backendUrl, storage} from '../common/Common';

const triggerNetworkErrorFunction = () => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(
      'Network Error. Please check your internet connection.',
      ToastAndroid.LONG,
    );
  } else {
    Alert.alert('Network Error', 'Please check your internet connection.');
  }
};

const api = axios.create({
  baseURL: backendUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: ['application/json', 'multipart/form-data'],
  },
});
let isNavigate = false;
api.interceptors.request.use(
  config => {
    const token = storage.getString('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  error => Promise.reject(error),
);
api.interceptors.response.use(
  response => {
    return response.data;
  },
  async error => {
    if (!error.response) {
      triggerNetworkErrorFunction();
    }

    const {response} = error;
    if (response && response.status === 401) {
      if (!isNavigate) {
        navigate('Logout');
        isNavigate = true;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
