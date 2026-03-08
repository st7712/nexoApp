// App.js
import React, { useState, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import * as Font from "expo-font";
import EqualizerScreen from "./app/screens/EqualizerScreen";
import NexoScreen from "./app/screens/NexoScreen";
import SettingsScreen from "./app/screens/settings/SettingsScreen";
import NetworkSettingsScreen from "./app/screens/settings/NetworkSettingsScreen";
import HomeScreen from "./app/screens/HomeScreen";

import colors from "./app/assets/js/colors";

import { NavigationContainer } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack"; toto nefungovalo dobre lol

import { createStackNavigator } from "@react-navigation/stack";

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  const loadFonts = async () => {
    await Font.loadAsync({
      "Inter Thin": require("./app/assets/fonts/Inter Thin.ttf"),
    });
    setFontsLoaded(true);
  };

  useEffect(() => {
    loadFonts(); // Load fonts asynchronously
  }, []);

  // Show a loading spinner until fonts are loaded
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View style={{ flex: 1, backgroundColor: colors.black }}>
        <Stack.Navigator initialRouteName={`Home`}>
          <Stack.Screen
            name="Equalizer"
            component={EqualizerScreen}
            options={{
              title: "Equalizer",
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Nexo"
            component={NexoScreen}
            options={{
              title: "Nexo",
              headerShown: false,
              animation: "slide_from_left",
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: "Settings",
              headerShown: false,
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="NetworkSettings"
            component={NetworkSettingsScreen}
            options={{
              title: "NetworkSettings",
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: "Home",
              headerShown: false,
              animation: "fade",
            }}
          />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}
