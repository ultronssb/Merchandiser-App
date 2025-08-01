import {NavigationContainer} from '@react-navigation/native';
import React, {useContext, useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {PaperProvider} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import AuthStack from './src/Route/MainRoute';
import {NavigationProvider} from './src/service/context/NavigationContext';
import {navigationRef} from './src/service/hook/navigationRef';
// import {
//   ToastContext,
//   ToastProvider,
// } from './src/Service/Hook/Toast/CustomToastContext';
// import {setToastRef} from './src/Service/Hook/Toast/CustomToast';
import {
  ToastContext,
  ToastProvider,
} from './src/service/hook/Toast/CustomToastContext';
import {setToastRef} from './src/service/hook/Toast/CustomToast';
const ToastInitializer = () => {
  const toast = useContext(ToastContext);

  useEffect(() => {
    setToastRef(toast);
  }, [toast]);

  return null;
};
const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer ref={navigationRef}>
        <NavigationProvider>
          <ToastProvider>
            <ToastInitializer />
            <PaperProvider>
              <SafeAreaView style={styles.container}>
                <AuthStack />
              </SafeAreaView>
            </PaperProvider>
          </ToastProvider>
        </NavigationProvider>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
