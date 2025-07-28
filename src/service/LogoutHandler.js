// components/LogoutHandler.js
import { useEffect } from "react";
import { useLogout } from "./hook/useLogout";

const LogoutHandler = () => {
  const logout = useLogout();

  useEffect(() => {
    logout(); // Trigger the logout process
  }, [logout]);

  return null; // This component doesn't need to render anything
};

export default LogoutHandler;
