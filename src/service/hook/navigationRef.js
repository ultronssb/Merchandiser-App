import {
  createNavigationContainerRef,
  StackActions
} from "@react-navigation/native";

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function push(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(StackActions.push(name, params));
  }
}
