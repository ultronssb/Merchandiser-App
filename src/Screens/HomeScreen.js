import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  StatusBar,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { common, storage } from '../common/Common';
import api from '../service/api';
import { font } from '../Settings/Theme';

const HomeScreen = () => {
  const [profile, setProfile] = useState({});
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchProfile = async () => {
    const userId = storage.contains('user') ? JSON.parse(storage.getString('user'))?.userId : null;
    if (!userId) return;

    try {
      const res = await api.get(`user/${userId}`);
      setProfile(res?.response || {});
    } catch (err) {
      console.log('Error fetching profile:', err?.response);
    }
  };

  const updateCurrentTime = () => {
    const now = new Date();
    const options = {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };
    setCurrentDateTime(now.toLocaleString('en-US', options).replace(',', '') + ' IST');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile();
    // updateCurrentTime();
    setRefreshing(false);
  };

  useEffect(() => {
    updateCurrentTime();
    onRefresh();
  }, []);

  const handleNavigation = (route, params = {}) => {
    navigation.navigate(route, params);
  };

  const userName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Guest User';

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBackgroundColor(common.PRIMARY_COLOR);
      StatusBar.setBarStyle('light-content');
      return () => {
        StatusBar.setBackgroundColor('#ffffff');
        StatusBar.setBarStyle('dark-content');
      };
    }, [])
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scrollViewContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[common.PRIMARY_COLOR]}
          tintColor="#fff"
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <Image source={require('../../assets/images/profile.png')} style={styles.profileImage} />
          <View style={styles.userInfo}>
            <Text style={styles.greetingText}>Welcome,</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.dateTime}>{currentDateTime}</Text>
          </View>
        </View>
      </View>
      <View style={styles.buttonsContainer}>
        <View style={styles.buttonGrid}>
          <HomeButton
            icon="list-alt"
            label="New Products"
            onPress={() => handleNavigation('NewProducts', { requestInfo: null })}
          />
          <HomeButton
            icon="spinner"
            label="InProgress Products"
            onPress={() => handleNavigation('InProgressProducts', { requestInfo: true })}
          />
          <HomeButton
            icon="times-circle"
            label="Approval Products"
            onPress={() => handleNavigation('ApprovalProducts', { requestInfo: false })}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const HomeButton = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.homeButton} onPress={onPress}>
    <Icon name={icon} size={28} color="#fff" />
    <Text style={styles.homeButtonText}>{label}</Text>
  </TouchableOpacity>
);

export default HomeScreen;

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: common.PRIMARY_COLOR,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: '45%'
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  greetingText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: font.medium,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontFamily: font.semiBold,
  },
  dateTime: {
    color: '#fff',
    fontSize: 12,
    fontFamily: font.medium,
    marginTop: 4,
  },
  buttonsContainer: {
    padding: 20,
  },
  buttonGrid: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  homeButton: {
    backgroundColor: common.PRIMARY_COLOR,
    width: '68%',
    marginBottom: 15,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: font.semiBold,
    marginTop: 10,
    textAlign: 'center',
  },
});
