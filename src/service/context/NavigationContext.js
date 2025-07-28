// context/NavigationContext.js
import { CommonActions, useNavigation } from "@react-navigation/native";
import React, { createContext, useContext, useState } from "react";

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const navigation = useNavigation(); // Use the useNavigation hook here inside a provider
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const logout = () => {
    setIsLoggedOut(true);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Signin" }],
      })
    );
  };

  return (
    <NavigationContext.Provider value={{ logout }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => useContext(NavigationContext);
