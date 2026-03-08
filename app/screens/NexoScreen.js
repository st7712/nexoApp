import React, { useState, useRef, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Text,
  Animated,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Slider } from "@miblanchard/react-native-slider";
import {
  useNavigation,
  CommonActions,
  useFocusEffect,
} from "@react-navigation/native"; // Import useNavigation hook
import * as NavigationBar from "expo-navigation-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import ToggleButton from "../assets/js/ToggleButton";
import {
  getNexoID,
  getNexoAPI,
  getTheme,
  getLanguage,
} from "../assets/js/StorageHandler";
import { darkTheme, lightTheme } from "../assets/js/colors";
import { english, czech } from "../assets/js/text";

let styles;

// Timeout-aware fetch
const fetchWithTimeout = (url, timeout = 3000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  return fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
  }).finally(() => clearTimeout(id));
};

function NexoScreen(props) {
  const navigation = useNavigation();
  const [isRotated, setIsRotated] = useState(false);

  const [loading, setLoading] = useState(true); // Loading state
  const [volume, setVolume] = useState(50);
  const [nexoID, setNexoID] = useState(null); // NexoID state
  const [nexoAPI, setNexoAPI] = useState(null); // NexoAPI state
  const [nexoName, setNexoName] = useState("");

  let [theme, setTheme] = useState(darkTheme);
  let [language, setLanguage] = useState(english);

  function toggleTheme(selectedTheme) {
    setTheme(selectedTheme);
    styles = createStyles(selectedTheme);
  }

  async function fetchTheme() {
    const savedTheme = await getTheme();
    if (savedTheme) {
      if (savedTheme === "dark") {
        toggleTheme(darkTheme);
      } else {
        toggleTheme(lightTheme);
      }
    }
  }

  async function fetchNexoID() {
    const result = await getNexoID();
    setNexoID(result);
    const API_url = await getNexoAPI();
    setNexoAPI(API_url);
  }

  async function fetchLanguage() {
    const savedLanguage = await getLanguage();
    if (savedLanguage === "english") {
      setLanguage(english);
    } else if (savedLanguage === "czech") {
      setLanguage(czech);
    }
  }

  async function fetchNexoName(apiUrl) {
    if (apiUrl) {
      try {
        const response = await fetchWithTimeout(`${apiUrl}/`, 3000);
        const data = await response.json();
        setNexoName(data.name || "");
      } catch (error) {
        console.error("Error fetching Nexo name:", error);
        setNexoName("");
      }
    }
  }

  const fetchVolume = async () => {
    if (!nexoAPI) return;
    try {
      const response = await fetch(`${nexoAPI}/status/partial_state`);
      const data = await response.json();
      setVolume(data.volume || 50);
    } catch (error) {
      console.log("Partial Info Error:", error);
    }
  };

  useEffect(() => {
    fetchTheme();
    fetchLanguage();
    fetchNexoID();
    setLoading(false);
  }, []);

  // Fetch name when nexoAPI becomes available
  useEffect(() => {
    if (nexoAPI) {
      fetchNexoName(nexoAPI);
      fetchVolume();
    }
  }, [nexoAPI]);

  useFocusEffect(
    React.useCallback(() => {
      fetchTheme();
      fetchLanguage();
    }, [])
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.black,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  styles = createStyles(theme);

  const handleVolumeChange = async (val) => {
    const newVol = Array.isArray(val) ? val[0] : val;
    console.log("Setting Volume:", newVol);
    try {
      await fetch(`${nexoAPI}/control/local/volume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume: Math.round(newVol) }),
      });
    } catch (error) {
      console.error("Volume Error:", error);
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${nexoAPI}/settings/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  return (
    <SafeAreaView style={styles.background}>
      <StatusBar
        barStyle={theme.themeName === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.black}
      />
      <View style={styles.header}>
        <Pressable
          style={styles.arrowWrapper}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Svg width="40" height="36" viewBox="0 0 40 36" fill="none">
            <Path
              d="M15.6474 33.8385V23.0309H24.343V33.8385C24.343 35.0273 25.3212 36 26.5169 36H33.0385C34.2342 36 35.2124 35.0273 35.2124 33.8385V18.7079H38.9081C39.9081 18.7079 40.3863 17.4758 39.6254 16.8274L21.4517 0.551186C20.6256 -0.183729 19.3647 -0.183729 18.5387 0.551186L0.364893 16.8274C-0.374232 17.4758 0.0822861 18.7079 1.08228 18.7079H4.7779V33.8385C4.7779 35.0273 5.75615 36 6.9518 36H13.4735C14.6691 36 15.6474 35.0273 15.6474 33.8385Z"
              fill={theme.text}
            />
          </Svg>
          <Text style={styles.text} numberOfLines={1}>
            {nexoName || nexoID}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            navigation.dispatch(
              CommonActions.navigate({
                name: "Settings",
              })
            );
          }}
        >
          <Svg width="35" height="34" viewBox="0 0 35 34">
            <Path
              d="M1.73492 5.3333H8.68272M33 5.3333H15.6305M1.73492 17H22.5783M33 17H29.5261M1.73492 28.6666H5.20882M33 28.6666H12.1566"
              stroke={theme.white}
              strokeWidth="3"
              strokeLinecap="round"
              fillOpacity={0}
            />
            <Path
              d="M12.1566 8.66664C14.0752 8.66664 15.6305 7.17426 15.6305 5.33331C15.6305 3.49236 14.0752 1.99998 12.1566 1.99998C10.238 1.99998 8.68268 3.49236 8.68268 5.33331C8.68268 7.17426 10.238 8.66664 12.1566 8.66664Z"
              stroke={theme.white}
              strokeWidth="3"
              strokeLinecap="round"
              fillOpacity={0}
            />
            <Path
              d="M26.0522 20.3333C27.9708 20.3333 29.5261 18.8409 29.5261 17C29.5261 15.1591 27.9708 13.6667 26.0522 13.6667C24.1336 13.6667 22.5783 15.1591 22.5783 17C22.5783 18.8409 24.1336 20.3333 26.0522 20.3333Z"
              stroke={theme.white}
              strokeWidth="3"
              strokeLinecap="round"
              fillOpacity={0}
            />
            <Path
              d="M8.68276 32C10.6013 32 12.1567 30.5076 12.1567 28.6667C12.1567 26.8257 10.6013 25.3334 8.68276 25.3334C6.76418 25.3334 5.20886 26.8257 5.20886 28.6667C5.20886 30.5076 6.76418 32 8.68276 32Z"
              stroke={theme.white}
              strokeWidth="3"
              strokeLinecap="round"
              fillOpacity={0}
            />
          </Svg>
        </Pressable>
      </View>
      <View style={styles.connectedContainer}>
        <Text style={[styles.text, { color: theme.realwhite }]}>
          {nexoName
            ? language.NexoScreen.connected
            : language.NexoScreen.disconnected}
        </Text>
        <Svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <Circle
            cx="7.5"
            cy="7.5"
            r="7.5"
            fill={nexoName ? theme.green : theme.red}
          />
        </Svg>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={100}
        step={1}
        containerStyle={styles.volumeSlider}
        maximumTrackTintColor={theme.quinary}
        minimumTrackTintColor={theme.primary}
        onValueChange={(val) => setVolume(Array.isArray(val) ? val[0] : val)} // Smooth local update
        onSlidingComplete={handleVolumeChange} // API Call on release
        thumbStyle={styles.volumeSliderThumb}
        trackStyle={styles.volumeSliderTrack}
        value={volume}
      />
      <ScrollView
        style={styles.buttonContainerOut}
        contentContainerStyle={styles.buttonContainer}
      >
        <ToggleButton
          label={language.NexoScreen.muteSpeaker}
          iconPathData="M3.05261 21.8125C2.40925 21.8125 1.86958 21.5945 1.43361 21.1586C0.999151 20.7241 0.781921 20.1852 0.781921 19.5418V10.4591C0.781921 9.81574 0.999151 9.27607 1.43361 8.8401C1.86958 8.40564 2.40925 8.18841 3.05261 8.18841H9.86467L17.3579 0.695147C18.077 -0.0239036 18.8997 -0.185122 19.8262 0.211491C20.7541 0.609618 21.2181 1.31959 21.2181 2.3414V27.6596C21.2181 28.6814 20.7541 29.3906 19.8262 29.7872C18.8997 30.1853 18.077 30.0248 17.3579 29.3058L9.86467 21.8125H3.05261Z"
          onMessage="mute"
          offMessage="unmute"
          isClickable={false}
          theme={theme}
          api={`${nexoAPI}/control/local/mute`}
        />
        <ToggleButton
          label={language.NexoScreen.microphone}
          iconPathData="M 15 0 C 11.886719 0 9.375 2.511719 9.375 5.625 L 9.375 7.382812 L 2.871094 0.878906 L 0.878906 2.871094 L 27.128906 29.121094 L 29.121094 27.128906 L 23.882812 21.890625 C 25.363281 19.996094 26.25 17.609375 26.25 15.023438 L 26.25 11.25 L 23.4375 11.25 L 23.4375 15.023438 C 23.4375 16.847656 22.867188 18.523438 21.890625 19.898438 L 19.847656 17.855469 C 20.339844 17.023438 20.625 16.046875 20.625 15 L 20.625 5.625 C 20.625 2.511719 18.113281 0 15 0 Z M 3.75 11.25 L 3.75 15.023438 C 3.75 20.582031 7.808594 25.203125 13.125 26.097656 L 13.125 30 L 16.875 30 L 16.875 26.097656 C 17.8125 25.933594 18.707031 25.664062 19.546875 25.289062 L 17.367188 23.109375 C 16.617188 23.320312 15.820312 23.4375 15 23.4375 C 10.296875 23.4375 6.5625 19.710938 6.5625 15.023438 L 6.5625 12.304688 L 5.507812 11.25 Z M 9.382812 15.125 C 9.449219 18.140625 11.859375 20.550781 14.875 20.617188 Z M 9.382812 15.125"
          onMessage="off"
          offMessage="on"
          isClickable={false}
          theme={theme}
          api={`${nexoAPI}/control/local/microphone`}
        />
        <ToggleButton
          label={language.equalizerScreen.headerTitle}
          iconPathData="M12.7058 1.45635L12.7064 1.45575C13.3471 0.813955 14.1026 0.5 15 0.5C15.8975 0.5 16.6538 0.813983 17.2958 1.45605C17.9365 2.09669 18.25 2.85229 18.25 3.75V26.25C18.25 27.1476 17.9365 27.9039 17.2958 28.5458C16.6539 29.1865 15.8976 29.5 15 29.5C14.1023 29.5 13.3467 29.1865 12.7061 28.5458C12.064 27.9038 11.75 27.1475 11.75 26.25V3.75C11.75 2.85256 12.064 2.09706 12.7058 1.45635ZM3.75 29.5C2.85229 29.5 2.09669 29.1865 1.45605 28.5458C0.813983 27.9038 0.5 27.1475 0.5 26.25V18.75C0.5 17.8525 0.813983 17.0962 1.45605 16.4542C2.09669 15.8135 2.85229 15.5 3.75 15.5C4.64771 15.5 5.40331 15.8135 6.04395 16.4542C6.68602 17.0962 7 17.8525 7 18.75V26.25C7 27.1475 6.68602 27.9038 6.04395 28.5458C5.40331 29.1865 4.64771 29.5 3.75 29.5ZM26.25 29.5C25.3524 29.5 24.5961 29.1865 23.9542 28.5458C23.3135 27.9039 23 27.1476 23 26.25V13.125C23 12.2273 23.3135 11.4709 23.9544 10.8289C24.5963 10.1884 25.3525 9.875 26.25 9.875C27.1475 9.875 27.9037 10.1884 28.5456 10.8289C29.1865 11.4709 29.5 12.2273 29.5 13.125V26.25C29.5 27.1476 29.1865 27.9039 28.5458 28.5458C27.9039 29.1865 27.1476 29.5 26.25 29.5Z"
          onMessage="on"
          offMessage="off"
          isClickable={true}
          clickedMessage="Equalizer"
          navigation={navigation}
          theme={theme}
          api={`${nexoAPI}/control/eq/status`}
        />
        <View style={styles.button}>
          <Pressable
            style={styles.pressableWindow}
            onPress={() => {
              navigation.dispatch(
                CommonActions.navigate({
                  name: "NetworkSettings",
                })
              );
            }}
          />
          <View style={styles.textIconWrapper}>
            <Svg width="30" height="22" viewBox="0 0 30 22" fill="none">
              <Path
                d="M0.608536 8.14909C1.34671 8.89091 2.5191 8.96364 3.31516 8.29455C10.0745 2.70909 19.8878 2.70909 26.6616 8.28C27.4722 8.94909 28.659 8.89091 29.3972 8.14909C30.2512 7.29091 30.1933 5.86545 29.2524 5.09455C20.9878 -1.69818 9.03236 -1.69818 0.753276 5.09455C-0.18753 5.85091 -0.2599 7.27636 0.608536 8.14909ZM11.8403 19.4364L13.968 21.5745C14.5325 22.1418 15.4443 22.1418 16.0088 21.5745L18.1365 19.4364C18.8167 18.7527 18.672 17.5745 17.8036 17.1236C16.0377 16.2073 13.9246 16.2073 12.1443 17.1236C11.3192 17.5745 11.16 18.7527 11.8403 19.4364ZM6.44153 14.0109C7.15075 14.7236 8.26525 14.7964 9.09026 14.2C12.6219 11.6836 17.3694 11.6836 20.901 14.2C21.726 14.7818 22.8405 14.7236 23.5497 14.0109L23.5642 13.9964C24.4326 13.1236 24.3747 11.64 23.376 10.9273C18.397 7.30545 11.6087 7.30545 6.61522 10.9273C5.61652 11.6545 5.55862 13.1236 6.44153 14.0109Z"
                fill={theme.text}
              />
            </Svg>
            <Text style={styles.buttonText}>{language.settings.network}</Text>
          </View>
        </View>
        <View style={styles.unpairButton}>
          <Pressable style={styles.pressableWindow} onPress={handleReset} />
          <Text style={styles.buttonText}>{language.NexoScreen.reset}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme) {
  return StyleSheet.create({
    background: {
      backgroundColor: theme.black,
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-start",
    },
    header: {
      backgroundColor: theme.black,
      height: 80,
      width: "100%",
      borderBottomColor: theme.tertiary,
      borderBottomWidth: 2,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingHorizontal: 30,
      paddingTop: 20,
      zIndex: 2,
    },
    arrowWrapper: {
      height: 34,
      maxWidth: 250,
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
    },
    text: {
      fontFamily: "Inter Thin",
      color: theme.white,
      fontSize: 24,
      fontWeight: 700,
    },
    connectedContainer: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: "#00000066",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 80,
      borderRadius: 50,
    },
    volumeSlider: {
      width: "80%",
    },
    volumeSliderThumb: {
      width: 10,
      height: 40,
      backgroundColor: theme.primary,
      borderRadius: 60,
      borderColor: theme.quinary,
      borderWidth: 2,
    },
    volumeSliderTrack: {
      height: 15,
      borderRadius: 15,
      borderColor: theme.tertiary,
      borderWidth: 2,
    },
    buttonContainerOut: {
      width: "100%",
      marginTop: 20,
      padding: 15,
    },
    buttonContainer: {
      alignItems: "center",
      gap: 10,
    },
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
    buttonText: {
      fontFamily: "Inter Thin",
      fontSize: 20,
      fontWeight: 500,
      color: theme.textsecond,
    },
    textIconWrapper: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginLeft: 10,
      gap: 10,
    },
    switchWrapper: {
      width: 80,
      height: 40,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "flex-end",
      borderLeftColor: theme.text,
      borderLeftWidth: 2,
    },
    pressableWindow: {
      position: "absolute",
      width: "100%",
      height: "100%",
      zIndex: 1,
    },
    unpairButton: {
      backgroundColor: theme.warning,
      width: "100%",
      height: 60,
      borderRadius: 60,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 10,
    },
  });
}

export default NexoScreen;
