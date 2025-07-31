export const common = { title: 'FabInsta', PRIMARY_COLOR: '#228be6' };
import Config from "react-native-config";

// export const backendUrl = 'http://192.168.1.8:8080/api';
// export const backendUrl = "https://uat.fabinsta.com/api";
export const backendUrl = Config.API_URL;
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

//Merchandiser_V1.1_Dev
//Merchandiser_V1.1_Uat
//Merchandiser_V1.1_Live