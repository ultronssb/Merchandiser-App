import {NavigationContainer} from '@react-navigation/native';
import React from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AuthStack from './src/Route/MainRoute';
import {PaperProvider} from 'react-native-paper';
import {NavigationProvider} from './src/service/context/NavigationContext';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {navigationRef} from './src/service/hook/navigationRef';

const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer ref={navigationRef}>
        <NavigationProvider>
          <PaperProvider>
            <SafeAreaView style={styles.container}>
              <AuthStack />
            </SafeAreaView>
          </PaperProvider>
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
