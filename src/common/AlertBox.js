import React from "react";
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { font } from "../Settings/Theme";

const AlertBox = ({
  heading,
  message,
  triggerFunction,
  showAlert,
  setShowAlert,
  isRight = false,
  rightButtonText = "OK",
  isLeft = true,
}) => {
  if (!showAlert) return null;

  return (
    <Modal
      transparent
      animationType="none"
      visible={showAlert}
      style={styles.modal}
      onRequestClose={() => setShowAlert(false)}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Heading */}
          <Text style={styles.heading}>{heading}</Text>
          <View style={styles.spacing} />
          {/* Message */}
          <Text style={styles.message}>{message}</Text>
          <View style={styles.largeSpacing} />
          <View style={styles.divider} />
          <View style={styles.buttonRow}>
            {isRight && (
              <TouchableOpacity
                onPress={triggerFunction}
                style={[styles.button, styles.rightButton]}
              >
                <Text style={styles.buttonText}>{rightButtonText}</Text>
              </TouchableOpacity>
            )}
            {isLeft && (
              <TouchableOpacity
                onPress={() => {
                  setShowAlert?.();

                  console.log("first", setShowAlert);
                }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  alertContainer: {
    width: width * 0.75,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
  },
  heading: {
    fontSize: 16,
    color: "black",
    textAlign: "center",
    fontFamily: font.semiBold
  },
  spacing: {
    height: 10,
  },
  largeSpacing: {
    height: 20,
  },
  message: {
    fontSize: 14,
    color: "grey",
    textAlign: "center",
    fontFamily: font.regular
  },
  divider: {
    height: 1,
    backgroundColor: "#DDDDDD",
    marginVertical: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    alignItems: "center",
  },
  rightButton: {
    borderRightWidth: 1,
    borderRightColor: "#DDDDDD",
  },
  buttonText: {
    color: "#007AFF",
    fontSize: 16, fontFamily: font.semiBold
  },
});

export default AlertBox;