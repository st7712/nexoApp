// MultiSelectGroupItem.js
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { RadioButton } from "react-native-paper";

function MultiSelectGroupItem({
  title,
  options,
  selectedOption,
  onSelect,
  theme,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Animated values for rotation and height
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;
  const paddingAnim = useRef(new Animated.Value(0)).current;

  const toggleGroup = () => {
    const expanded = !isExpanded;

    // Rotate Arrow
    Animated.timing(rotationAnim, {
      toValue: expanded ? 90 : 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.linear,
    }).start();

    // Animate Height and Padding
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: expanded
          ? options.length
            ? options.length * 36 + 20
            : 46.7
          : 0, // Adjust based on content        duration: 300,
        useNativeDriver: false,
        easing: Easing.ease,
      }),
      Animated.timing(paddingAnim, {
        toValue: expanded ? 10 : 0,
        duration: 300,
        useNativeDriver: false,
        easing: Easing.ease,
      }),
    ]).start();

    setIsExpanded(expanded);
  };

  // Interpolate rotation value to degrees
  const rotateInterpolate = rotationAnim.interpolate({
    inputRange: [0, 90],
    outputRange: ["0deg", "90deg"],
    extrapolate: "clamp",
  });

  const styles = StyleSheet.create({
    groupContainerWrapper: {
      width: "100%",
      backgroundColor: theme.tertiary,
      borderRadius: 30,
      overflow: "hidden",
    },
    groupContainer: {
      width: "100%",
      height: 60,
      padding: 10,
      gap: 10,
      alignItems: "center",
      backgroundColor: theme.secondary,
      borderRadius: 30,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    textContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
      paddingLeft: 10,
    },
    textContainerText: {
      fontFamily: "Inter Thin",
      textAlign: "center",
      fontSize: 20,
      fontWeight: 500,
      color: theme.textsecond,
    },
    groupContent: {
      justifyContent: "flex-start",
      alignItems: "flex-start",
      paddingHorizontal: 10,
      backgroundColor: theme.tertiary,
      overflow: "hidden",
    },
    rotatedArrow: {
      transform: [{ rotate: "180deg" }],
    },
    optionContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    optionText: {
      color: theme.textsecond,
      fontSize: 18,
      fontFamily: "Inter Thin",
    },
  });

  return (
    <View style={styles.groupContainerWrapper}>
      <Pressable style={styles.groupContainer} onPress={toggleGroup}>
        <View style={styles.textContainer}>
          <AnimatedSvg
            width="30"
            height="22"
            viewBox="0 0 12 22"
            fill="none"
            style={{ transform: [{ rotate: rotateInterpolate }] }}
          >
            <Path
              d="M1 21L11 11L1 1"
              stroke={theme.textsecond}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </AnimatedSvg>
          <Text style={styles.textContainerText}>{title}</Text>
        </View>
      </Pressable>
      {/* Animated Content */}
      <Animated.View
        style={[
          styles.groupContent,
          {
            height: heightAnim,
            paddingVertical: paddingAnim,
          },
        ]}
      >
        {options && options.length > 0 ? (
          options.map((option, index) => (
            <Pressable
              key={index}
              style={styles.optionContainer}
              onPress={() => onSelect(title, option)}
            >
              <RadioButton
                value={option.toLowerCase()}
                status={
                  selectedOption === option.toLowerCase()
                    ? "checked"
                    : "unchecked"
                }
                onPress={() => onSelect(title, option)}
                color={theme.primary}
              />
              <Text style={styles.optionText}>{option}</Text>
            </Pressable>
          ))
        ) : (
          <Text style={[styles.textContainerText, { fontSize: 18 }]}>
            • -- •
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

// Create an Animated version of Svg
const AnimatedSvg = Animated.createAnimatedComponent(Svg);

export default MultiSelectGroupItem;
