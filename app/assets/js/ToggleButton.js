// ToggleButton.js

import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Switch } from "react-native-switch";
import Svg, { Path } from "react-native-svg";

function ToggleButton({
  label,
  iconPathData,
  onMessage,
  offMessage,
  isClickable,
  clickedMessage = "",
  navigation = { navigate: () => {} },
  theme,
  api = "",
}) {
  const [isEnabled, setIsEnabled] = useState(false);

  const toggleSwitch = () => {
    setIsEnabled((previousState) => {
      const newState = !previousState;
      if (newState) {
        console.log(`${onMessage} ${label}`);
        sendApiRequest(onMessage);
      } else {
        console.log(`${offMessage} ${label}`);
        sendApiRequest(offMessage);
      }
      return newState;
    });
  };

  const clickableSwitch = () => {
    if (isClickable) {
      navigation.navigate(clickedMessage);
    }
    return null;
  };

  const sendApiRequest = async (action) => {
    if (!api) return;
    try {
      await fetch(`${api}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: action }),
      });
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  const styles = StyleSheet.create({
    button: {
      backgroundColor: theme.secondary,
      width: "100%",
      height: 60,
      borderRadius: 60,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 10,
    },
    textIconWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingLeft: 10,
    },
    buttonText: {
      fontFamily: "Inter Thin",
      fontSize: 20,
      fontWeight: "500",
      color: theme.textsecond,
    },
    switchWrapper: {
      width: 80,
      height: 40,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    switchClickable: {
      borderLeftColor: theme.text,
      borderLeftWidth: 1,
    },
    pressableWindow: {
      position: "absolute",
      width: "80%",
      height: "100%",
      zIndex: 1,
    },
  });

  return (
    <View style={styles.button}>
      <Pressable
        style={styles.pressableWindow}
        onPress={isClickable ? clickableSwitch : null}
      />
      <View style={styles.textIconWrapper}>
        <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <Path d={iconPathData} fill={theme.text} />
        </Svg>
        <Text style={styles.buttonText}>{label}</Text>
      </View>
      <View
        style={[
          styles.switchWrapper,
          isClickable ? styles.switchClickable : null,
        ]}
      >
        <Switch
          value={isEnabled}
          onValueChange={toggleSwitch}
          activeText=""
          inActiveText=""
          circleSize={30}
          barHeight={30}
          circleBorderWidth={3}
          backgroundActive={theme.primary}
          backgroundInactive={theme.text}
          changeValueImmediately={true}
        />
      </View>
    </View>
  );
}

export default ToggleButton;
