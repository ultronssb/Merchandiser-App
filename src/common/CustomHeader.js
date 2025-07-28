// Header.js
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {font} from '../Settings/Theme';
import {common} from './Common';

const Header = ({scrollY, onOptionsPress, onQrPress}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{common.title}</Text>
      <TouchableOpacity onPress={onOptionsPress} style={styles.iconButton}>
        <Icon name="menu" size={24} color="#228be6" />
      </TouchableOpacity>
      {/* <TouchableOpacity onPress={onQrPress} style={styles.iconButton}>
        <Icon name="qrcode" size={24} color="#228be6" />
      </TouchableOpacity> */}
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 20,
    fontFamily: font.semiBold,
  },
  iconButton: {
    padding: 8,
  },
});
