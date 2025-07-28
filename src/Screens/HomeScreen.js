import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect } from 'react';
import { storage } from '../common/Common';
import DisplayVendor from './DisplayVendor';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <DisplayVendor />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
