import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { font } from '../Settings/Theme';
import { TouchableRipple } from 'react-native-paper';
import Feather from 'react-native-vector-icons/Feather';
import api from '../service/api';
import { common, storage } from '../common/Common';
import AlertBox from '../common/AlertBox';
import axios from 'axios';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigation = useNavigation();
  const [isError, setIsError] = useState({
    message: '',
    heading: '',
    isRight: false,
    rightButtonText: 'OK',
    triggerFunction: () => { },
    setShowAlert: () => { },
    showAlert: false,
    isLeft: true,
  });
  const closeAlert = () => {
    setIsError(prev => ({ ...prev, showAlert: false }));
  };
  const validateEmail = email => {
    const re = /^\S+@\S+\.\S+$/;
    return re.test(email);
  };
  useEffect(() => {
    const res = storage.getString('token');

    if (res) {
      clearStackAndNavigate();
    }
  }, []);

  const clearStackAndNavigate = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "Home",
          },
        ],
      })
    );
  };
  const sendData = async () => {
    setLoading(true);
    Keyboard.dismiss();
    const loginRequestBody = { emailId: email, password: password };
    try {
      const response = await api.post('user/login', {
        emailId: email.toLowerCase(),
        password: password,
      });
      const { token } = response?.response;
      storage.set('token', token);
      storage.set('user', JSON.stringify(response?.response));
      console.log(response);
      setIsError({
        message: `Logged in User: ${response?.response?.userId}`,
        heading: response?.message,
        isRight: true,
        isLeft: false,
        rightButtonText: 'OK',
        triggerFunction: () => {
          clearStackAndNavigate();
        },
        setShowAlert: () => {
          isError.setShowAlert(false);
        },
        showAlert: true,
      });
    } catch (error) {
      const message = error?.response?.data?.message || error?.message;
      // console.log(error);
      setIsError({
        message: `Oops: ${message || 'Something went wrong!!!'}`,
        heading: message,
        isRight: false,
        isLeft: true,
        rightButtonText: 'OK',
        triggerFunction: () => { },
        setShowAlert: () => {
          isError.setShowAlert(false);
        },
        showAlert: true,
      });
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = () => {
    if (!validateEmail(email)) {
      Vibration.vibrate(100);
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    sendData();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      {loading && (
        <View
          style={{
            position: 'absolute',
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            height: '100%',
            width: '100%',
            justifyContent: 'center',
            zIndex: 100,
          }}>
          <ActivityIndicator color={common.PRIMARY_COLOR} size="large" />
        </View>
      )}
      <AlertBox
        heading={isError.heading}
        message={isError.message}
        setShowAlert={closeAlert}
        showAlert={isError.showAlert}
        triggerFunction={isError.triggerFunction}
        isLeft={isError.isLeft}
        isRight={isError.isRight}
        rightButtonText={isError.rightButtonText}
      />
      <View style={styles.container}>
        <Text style={styles.headerText}>Log in to Ultron</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, emailError && { borderColor: 'red' }]}
            value={email}
            onChangeText={text => setEmail(text)}
            placeholder="ex: ultronuser@gmail.com"
            cursorColor={'#228be6'}
          />
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : null}
        </View>
        <View
          style={[
            styles.input,
            { padding: 0, flexDirection: 'row', alignItems: 'center' },
          ]}>
          <TextInput
            style={styles.inputPassword}
            value={password}
            onChangeText={text => setPassword(text)}
            placeholder="Your Password"
            cursorColor={'#228be6'}
            secureTextEntry={!passwordVisible}
          />
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setPasswordVisible(!passwordVisible)}>
            {passwordVisible ? (
              <Feather name="eye" size={20} color={'#666'} />
            ) : (
              <Feather name="eye-off" size={20} color={'#666'} />
            )}
          </TouchableOpacity>
        </View>
        <TouchableRipple
          onPress={handleLogin}
          rippleColor={'rgb(0,0,0,0.2)'}
          style={styles.button}>
          <Text style={styles.loginButtontext}>Log in</Text>
        </TouchableRipple>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
  },
  headerText: {
    fontSize: 30,
    fontFamily: font.regular,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    fontFamily: font.regular,
    padding: 10,
    width: '100%',
    maxWidth: 300,
    height: 40,
    color: '#000',
  },
  inputPassword: {
    borderRadius: 5,
    fontFamily: font.regular,
    padding: 10,
    width: '90%',
    maxWidth: 300,
    height: 40,
    color: '#000',
  },
  iconContainer: {
    height: '100%',
    width: '10%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    height: 40,
    width: '80%',
    maxWidth: 300,
    backgroundColor: '#228be6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
  },
  loginButtontext: {
    color: '#fff',
    fontSize: 20,
    fontFamily: font.medium,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    fontFamily: font.medium,
    alignSelf: 'flex-start',
  },
});
