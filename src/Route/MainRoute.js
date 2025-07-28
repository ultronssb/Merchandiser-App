import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DrawerLayout } from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/FontAwesome';
import { storage } from '../common/Common';
import Header from '../common/CustomHeader';
import CustomDrawer from '../common/DrawerContent';
import HomeScreen from '../Screens/HomeScreen';
import LoginScreen from '../Screens/LoginScreen';
import api from '../service/api';
import LogoutHandler from '../service/LogoutHandler';
import { font } from '../Settings/Theme';
import DisplayVendor from '../Screens/DisplayVendor';
import VendorCreate from '../Screens/CreateVendor';

const screenWidth = Dimensions.get('window').width;
const isLargeScreen = screenWidth > 768;

const Stack = createStackNavigator();


const CustomHeader = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const formatRouteName = (name) => {
    return name
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .replace("Screen", "");
  };

  // Use custom headerTitle from route.params if provided, otherwise fallback to formatRouteName
  const title = route.params?.fromScreen === "CustomerDraft"
    ?
    "Approve Customer" : route.params?.isEdit === true ? "Edit Customer" : formatRouteName(route.name);

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="arrow-left" size={isLargeScreen ? 24 : 20} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>

      <View style={styles.backButton} />
    </View>
  );
};


const MainStack = () => {
  const navigation = useNavigation();
  const drawerRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const handleCreate = () => {
    navigation.navigate('VendorCreate', {
      isCreateCustomer: true,
      isEditCustomer: false,
      customerId: '',
    });
  };
  const MAX_RETRIES = 10; // Avoid infinite loop
  const RETRY_DELAY = 1000; // 1 second

  const fetchAllProfile = async (retryCount = 0) => {
    const userString = storage.contains('user') ? storage.getString('user') : null;

    if (!userString) {
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => fetchAllProfile(retryCount + 1), RETRY_DELAY);
      } else {
        console.warn('Max retries reached. User not found in storage.');
        setLoadingProfile(false);
      }
      return;
    }

    const userId = JSON.parse(userString)?.userId;
    if (!userId) {
      console.warn('User ID is null after parsing.');
      setLoadingProfile(false);
      return;
    }

    try {
      const res = await api.get(`user/${userId}`);
      if (res?.response) {
        setProfile(res.response);
        setLoadingProfile(false);
      } else {
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => fetchAllProfile(retryCount + 1), RETRY_DELAY);
        } else {
          console.warn('Max retries reached. API did not return response.');
          setLoadingProfile(false);
        }
      }
    } catch (error) {
      console.log('Error fetching profile:', error?.response);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => fetchAllProfile(retryCount + 1), RETRY_DELAY);
      } else {
        setLoadingProfile(false);
      }
    }
  };

  useEffect(() => {
    fetchAllProfile();
  }, []);

  const openDrawer = () => {

    if (drawerRef.current) {
      drawerRef.current.openDrawer();
    }
  };

  const closeDrawer = () => {
    if (drawerRef.current) {
      drawerRef.current.closeDrawer();
    }
  };

  const clearStackAndNavigate = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
    );
    storage.delete('token');
  };



  const options = [
    {
      order: 1,
      displayOrder: 1,
      label: 'Create Vendor',
      onPress: () => {
        closeDrawer();
        setTimeout(() => {
          handleCreate();
        }, 100);
      },
    },
    {
      order: 2,
      displayOrder: 1,
      label: 'Logout',
      onPress: () => {
        closeDrawer();
        setTimeout(() => {
          clearStackAndNavigate();
        }, 100);
      },
    },
  ];

  const handleQrPress = () => {
    navigation.navigate('QRScanner', { navigation });
  };

  return (
    <DrawerLayout
      ref={drawerRef}
      drawerWidth={screenWidth / 1.5}
      drawerPosition="left"
      renderNavigationView={() => (
        <CustomDrawer
          options={options}
          closeDrawer={closeDrawer}
          profile={profile}
        />
      )}
    >
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          initialRouteName="Login"
          screenOptions={({ route }) => ({
            gestureEnabled: false,
            transitionSpec: {
              open: { animation: 'timing', config: { duration: 100 } },
              close: { animation: 'timing', config: { duration: 100 } },
            },
            cardStyleInterpolator: ({ current, layouts }) => ({
              cardStyle: {
                transform: [
                  {
                    translateX: current.progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [layouts.screen.width, 0],
                    }),
                  },
                ],
              },
            }),
            header: route.name !== 'Login' && route.name !== 'QRScanner'
              ? () => (
                route.name === 'Customer' || route.name === 'Home'
                  ? <Header onOptionsPress={openDrawer} onQrPress={handleQrPress} route={route} />
                  : <CustomHeader />
              )
              : undefined,
            headerShown: route.name !== 'Login' && route.name !== 'QRScanner',
            headerStyle: {
              height: isLargeScreen ? 80 : 60,
              backgroundColor: 'white',
            },
          })}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Logout" component={LogoutHandler} />
          <Stack.Screen name="DisplayVendor" component={DisplayVendor} />
          <Stack.Screen name="VendorCreate" component={VendorCreate} />


        </Stack.Navigator>
      </View>
    </DrawerLayout >
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: isLargeScreen ? 80 : 60,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingTop: isLargeScreen ? 20 : Platform.OS === 'ios' ? 10 : 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: font.semiBold,
    fontSize: isLargeScreen ? 22 : 20,
    color: '#333',
    textAlign: isLargeScreen ? 'center' : 'left',
    flex: 1,
    marginTop: isLargeScreen ? 10 : 0,
  },
});

export default MainStack;