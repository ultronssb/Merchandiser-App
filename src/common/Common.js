import Config from "react-native-config";


const mode = Config.APP_MODE === 'UAT' ? "Uat" : Config.APP_MODE === 'DEVELOPMENT' ? "Dev" : Config.APP_MODE === 'PRODUCTION' ? "Live" : "dev";
export const common = { title: `FabInsta ${mode}`, PRIMARY_COLOR: '#228be6' };

// export const backendUrl = 'http://192.168.1.8:8080/api';
// export const backendUrl = "https://uat.fabinsta.com/api";
export const backendUrl = Config.API_URL;
import { MMKV } from 'react-native-mmkv';
export const storage = new MMKV();

//Merchandiser_V1.1_Dev
//Merchandiser_V1.1_Uat
//Merchandiser_V1.1_Live