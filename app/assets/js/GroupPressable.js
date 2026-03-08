import React, { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import colors from "./colors"; // Adjust the import path as needed

const GroupPressable = ({
  children,
  style,
  activeColor,
  inactiveColor,
  ...props
}) => {
  const [isActive, setIsActive] = useState(false);

  const handlePress = () => {
    setIsActive((prevState) => !prevState);
  };

  return (
    <Pressable
      style={[
        style,
        {
          borderColor: isActive
            ? activeColor || colors.primary
            : inactiveColor || colors.quinary,
        },
      ]}
      onPress={() => { handlePress(); console.log("Room Pressed"); }}
      {...props}
    >
      {children}
    </Pressable>
  );
};

export default GroupPressable;
