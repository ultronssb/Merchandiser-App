import {StyleSheet, Text, View} from 'react-native';
import React, {useEffect} from 'react';
import {storage} from '../common/Common';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text>HomeScreen</Text>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: '#fff',
  },
});
