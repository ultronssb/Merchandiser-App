export const common = { title: 'FabInsta', PRIMARY_COLOR: '#228be6' };

export const backendUrl = 'http://192.168.1.8:8080/api';
// export const backendUrl = "https://uat.fabinsta.com/api";
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();
