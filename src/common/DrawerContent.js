// CustomDrawer.js
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { font } from '../Settings/Theme';
import { useRoute } from '@react-navigation/native';

const CustomDrawer = ({ options, closeDrawer, profile }) => {

  return (
    <ScrollView style={styles.drawerContainer}>
      <View style={styles.profileSection}>
        <Image
          source={require("../../assets/images/profile.png")}
          style={{
            width: 75,
            height: 75,
            borderRadius: 50
          }} />
        <Text style={styles.profileName}>
          {(profile?.firstName !== (null || undefined) && profile?.lastName !== (null || undefined)
            ? `${profile?.firstName} ${profile?.lastName}`
            : "Guest"
          )}
        </Text>
      </View>
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.option}
            onPress={option.onPress}>
            <Text style={styles.optionLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* <TouchableOpacity onPress={closeDrawer} style={styles.closeButton}>
        <Text style={styles.closeText}>Close Drawer</Text>
      </TouchableOpacity> */}
    </ScrollView>
  );
};

export default CustomDrawer;

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  profileSection: {
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 13,
    fontFamily: font.semiBold,
    textAlign: 'left',
  },
  optionsContainer: {
    marginVertical: 20,
  },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionLabel: {
    fontSize: 18,
    fontFamily: font.regular,
    color: '#333',
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  closeText: {
    color: '#228be6',
    fontSize: 16,
  },
});