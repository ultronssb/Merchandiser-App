import { CommonActions, useNavigation } from "@react-navigation/native";
import { storage } from "../../common/Common";

export const useLogout = () => {
  const navigation = useNavigation();

  const logout = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Login" }],
      })
    );
    storage.delete("token");
  };

  return logout;
};
