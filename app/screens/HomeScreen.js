import React, { useState, useRef, useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  ImageBackground,
  View,
  Text,
  TextInput,
  Animated,
  StatusBar,
  ScrollView,
  PanResponder,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Slider } from "@miblanchard/react-native-slider";
import {
  useNavigation,
  CommonActions,
  useFocusEffect,
  useIsFocused,
} from "@react-navigation/native"; // Import useNavigation hook
import * as Progress from "react-native-progress";
import { SafeAreaView } from "react-native-safe-area-context";

import GroupPressable from "../assets/js/GroupPressable";
import {
  getTheme,
  getLanguage,
  saveNexoID,
  saveNexoAPI,
} from "../assets/js/StorageHandler";
import { darkTheme, lightTheme } from "../assets/js/colors";
import { english, czech } from "../assets/js/text";

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

let styles;

// --- SPEAKER CONTROL LOGIC ---
const DEVICE_PORT = 8000; // Port that devices listen on
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

let groupsData = [];
let deviceCacheRef = {
  devices: [],
  timestamp: null,
};

// Network Scanner Function
const fetchWithTimeout = (url, timeout = 500) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  return fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
  }).finally(() => clearTimeout(id));
};

const scanNetwork = async (setDevicesList, setMasterAPI) => {
  // Check cache first
  const now = Date.now();
  if (
    deviceCacheRef.devices.length > 0 &&
    now - deviceCacheRef.timestamp < CACHE_DURATION
  ) {
    console.log("Using cached devices");
    setDevicesList(deviceCacheRef.devices);
    return;
  }

  console.log("Starting network scan...");
  const foundDevices = [];
  const MAX_CONCURRENT = 30;

  const worker = async (ip) => {
    const url = `http://${ip}:${DEVICE_PORT}/`;
    try {
      const response = await fetchWithTimeout(url, 600); // 600ms per host
      if (!response.ok) return;
      const data = await response.json();
      const device = {
        id: data.id || `device_${ip}`,
        name: data.name || `Device ${ip}`,
        api: url.slice(0, -1),
        master: !!data.master,
      };
      foundDevices.push(device);
      if (device.master) {
        setMasterAPI((prev) => prev || device.api);
      }
    } catch (err) {
      // ignore timeouts / refusals
    }
  };

  const ips = Array.from({ length: 255 }, (_, idx) => `192.168.0.${idx + 1}`);

  // Process in chunks to bound concurrency
  for (let i = 0; i < ips.length; i += MAX_CONCURRENT) {
    const slice = ips.slice(i, i + MAX_CONCURRENT);
    await Promise.all(slice.map((ip) => worker(ip)));
  }

  setDevicesList(foundDevices);

  // Update cache
  deviceCacheRef = {
    devices: foundDevices,
    timestamp: Date.now(),
  };

  console.log(`Network scan complete. Found ${foundDevices.length} devices.`);
  return foundDevices;
};

function HomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [isRotated, setIsRotated] = useState(false);

  const [loading, setLoading] = useState(true); // Loading state

  let [theme, setTheme] = useState(darkTheme);
  let [language, setLanguage] = useState(english);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [trackInfo, setTrackInfo] = useState({
    title: "Waiting for music...",
    artist: "Nexo",
    image: null, // URL string
    duration: 1, // Avoid divide by zero
    album: "Nexo App",
    mode: "stop",
  });
  const [trackPosition, setTrackPosition] = useState(0);
  const [devicesList, setDevicesList] = useState([]);
  const [masterAPI, setMasterAPI] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // Scan network for devices
  const handleNetworkScan = async () => {
    setIsScanning(true);
    await scanNetwork(setDevicesList, setMasterAPI);
    setIsScanning(false);
  };

  // Helper: Format Seconds to MM:SS
  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };

  // 1. API Fetch Track Info
  const fetchTrackInfo = async () => {
    if (!masterAPI) return;
    try {
      const response = await fetch(`${masterAPI}/status/state`);
      const data = await response.json();
      console.log(data);
      setTrackInfo({
        title: data.track.title,
        artist: data.track.artist,
        image: data.track.image_url, // URL string
        duration: data.track.duration_sec || 1, // Avoid divide by zero
        album: data.track.album,
        mode: data.mode,
      });
      setVolume(data.volume || 50);
    } catch (error) {
      console.log("Track Info Error:", error);
    }
  };

  const fetchPartialInfo = async () => {
    if (!masterAPI) return;
    try {
      const response = await fetch(`${masterAPI}/status/partial_state`);
      const data = await response.json();
      setTrackPosition(data.position || 0);
      setVolume(data.volume || 50);
      if (data.status == "Playing") {
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.log("Partial Info Error:", error);
    }
  };

  useEffect(() => {
    if (!masterAPI || !isFocused) return; // wait until we have a device API and screen is focused

    // Run once immediately when master API becomes available and focused
    fetchTrackInfo();

    const interval = setInterval(() => {
      skipNextPartial.current = true; // pause the partial poll on next tick
      fetchTrackInfo();
    }, 7000);

    return () => clearInterval(interval);
  }, [masterAPI, isFocused]);

  const skipNextPartial = useRef(false);

  useEffect(() => {
    if (!masterAPI || !isFocused) return; // wait until we have a device API and screen is focused

    const interval = setInterval(() => {
      if (skipNextPartial.current) {
        skipNextPartial.current = false;
        return;
      }
      fetchPartialInfo();
    }, 1000);

    return () => clearInterval(interval);
  }, [masterAPI, isFocused]);

  // 2. API Helper Functions
  const sendControl = async (action) => {
    if (!masterAPI) return;
    try {
      // Optimistic UI update for Play/Pause
      if (action === "play_pause") setIsPlaying(!isPlaying);

      await fetch(`${masterAPI}/control/playback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: action }),
      });
    } catch (error) {
      console.error("API Error:", error);
    }
  };

  const handleVolumeChange = async (val) => {
    if (!masterAPI) return;
    // val comes as an array from react-native-slider e.g. [50]
    const newVol = Array.isArray(val) ? val[0] : val;
    console.log("Setting Volume:", newVol);
    try {
      await fetch(`${masterAPI}/control/volume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume: Math.round(newVol) }),
      });
    } catch (error) {
      console.error("Volume Error:", error);
    }
  };

  function toggleTheme(selectedTheme) {
    styles = createStyles(selectedTheme);
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

  async function fetchLanguage() {
    const savedLanguage = await getLanguage();
    if (savedLanguage === "english") {
      setLanguage(english);
    } else if (savedLanguage === "czech") {
      setLanguage(czech);
    }
  }

  // Animated value for rotation
  const rotation = useRef(new Animated.Value(0)).current;

  // Function to handle arrow rotation toggle
  const arrowList = () => {
    const nextIsRotated = !isRotated;

    // If opening the menu, set menuVisible to true before animation
    if (nextIsRotated) {
      setMenuVisible(true);
    }

    Animated.parallel([
      Animated.timing(rotation, {
        toValue: nextIsRotated ? 90 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(dropDownAnimation, {
        toValue: nextIsRotated ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animation complete callback
      // If closing the menu, set menuVisible to false after animation
      if (!nextIsRotated) {
        setMenuVisible(false);
      }
    });

    setIsRotated(nextIsRotated);
  };

  useEffect(() => {
    fetchTheme();
    fetchLanguage();
    // Scan network on component mount
    handleNetworkScan();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchTheme();
      fetchLanguage();
    }, [])
  );

  // Interpolate the rotation value to degrees
  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 90],
    outputRange: ["0deg", "90deg"],
    extrapolate: "clamp",
  });

  // Define the rotation style
  const rotateStyle = {
    transform: [{ rotate: rotateInterpolate }],
  };

  const dropDownAnimation = useRef(new Animated.Value(0)).current;

  const [dropDownMenuHeight, setDropDownMenuHeight] = useState(0);

  const [menuVisible, setMenuVisible] = useState(false);

  const dropDownTranslateY = dropDownAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-dropDownMenuHeight || -1000, 40], // Add 10px offset from top
  });

  const dropDownMenuStyle = {
    transform: [{ translateY: dropDownTranslateY }],
  };

  useEffect(() => {
    setLoading(false);
  }, []);

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

  const handleNexoIDSave = async (nexoID, API_URL) => {
    await saveNexoID(nexoID);
    await saveNexoAPI(API_URL);
  };

  return (
    <SafeAreaView style={styles.background}>
      <StatusBar
        barStyle={theme.themeName === "dark" ? "light-content" : "dark-content"}
        backgroundColor={theme.black}
        translucent={false}
      />
      <View style={styles.header}>
        <Pressable style={styles.arrowWrapper} onPress={arrowList}>
          <AnimatedSvg
            width="19"
            height="34"
            viewBox="0 0 19 34"
            style={rotateStyle} // Apply the animated rotation style
          >
            <Path
              d="M2 32L17 17L2 2"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke={theme.white}
              fillOpacity={0}
            />
          </AnimatedSvg>
          <ImageBackground
            style={styles.logo}
            source={require("../assets/images/logoWhite.png")}
          />
        </Pressable>
        {menuVisible && (
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
                strokeWidth="3"
                strokeLinecap="round"
                stroke={theme.white}
                fillOpacity={0}
              />
              <Path
                d="M12.1566 8.66664C14.0752 8.66664 15.6305 7.17426 15.6305 5.33331C15.6305 3.49236 14.0752 1.99998 12.1566 1.99998C10.238 1.99998 8.68268 3.49236 8.68268 5.33331C8.68268 7.17426 10.238 8.66664 12.1566 8.66664Z"
                strokeWidth="3"
                strokeLinecap="round"
                stroke={theme.white}
                fillOpacity={0}
              />
              <Path
                d="M26.0522 20.3333C27.9708 20.3333 29.5261 18.8409 29.5261 17C29.5261 15.1591 27.9708 13.6667 26.0522 13.6667C24.1336 13.6667 22.5783 15.1591 22.5783 17C22.5783 18.8409 24.1336 20.3333 26.0522 20.3333Z"
                strokeWidth="3"
                strokeLinecap="round"
                stroke={theme.white}
                fillOpacity={0}
              />
              <Path
                d="M8.68276 32C10.6013 32 12.1567 30.5076 12.1567 28.6667C12.1567 26.8257 10.6013 25.3334 8.68276 25.3334C6.76418 25.3334 5.20886 26.8257 5.20886 28.6667C5.20886 30.5076 6.76418 32 8.68276 32Z"
                strokeWidth="3"
                strokeLinecap="round"
                stroke={theme.white}
                fillOpacity={0}
              />
            </Svg>
          </Pressable>
        )}
      </View>
      {menuVisible && (
        <Pressable style={styles.dropDown} onPress={arrowList}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Animated.ScrollView
              style={[dropDownMenuStyle, { maxHeight: 400 }]}
              contentContainerStyle={styles.dropDownMenu}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                setDropDownMenuHeight(height);
              }}
            >
              {devicesList.length === 0 ? (
                <View
                  style={{ width: "100%", gap: 10, alignContent: "center" }}
                >
                  <Text style={styles.textDivider}>
                    {isScanning
                      ? "Scanning network..."
                      : language.homeScreen.noDevices}
                  </Text>
                  {!isScanning && (
                    <Pressable
                      style={[styles.dropDownButton]}
                      onPress={handleNetworkScan}
                    >
                      <Text style={[styles.text, styles.dropDownButtonText]}>
                        Scan Network
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : (
                <>
                  <Pressable
                    style={[styles.dropDownButton, { marginBottom: 5 }]}
                    onPress={handleNetworkScan}
                    disabled={isScanning}
                  >
                    <Text style={[styles.text, styles.dropDownButtonText]}>
                      {isScanning ? "Scanning..." : "🔄 Refresh Devices"}
                    </Text>
                  </Pressable>
                  {devicesList.map((device, index) => (
                    <Pressable
                      key={index}
                      style={styles.dropDownButton}
                      onPress={() => {
                        handleNexoIDSave(device.id, device.api);
                        navigation.dispatch(
                          CommonActions.navigate({
                            name: "Nexo",
                          })
                        );
                      }}
                    >
                      <Text
                        style={[styles.text, styles.dropDownButtonText]}
                        numberOfLines={1}
                      >
                        {device.name} {device.master ? "👑" : ""}
                      </Text>
                    </Pressable>
                  ))}
                </>
              )}
            </Animated.ScrollView>
          </Pressable>
        </Pressable>
      )}
      <ScrollView
        style={styles.buttonContainer}
        contentContainerStyle={{ alignItems: "center", gap: 10 }}
      >
        <View style={styles.bottomPlayerContainer}>
          <View style={styles.bottomMusicContainer}>
            <View style={styles.bottomMusicPlayGroupContainer}>
              <ImageBackground
                source={
                  trackInfo.image
                    ? { uri: trackInfo.image }
                    : require("../assets/images/appLogo.png")
                }
                imageStyle={{ borderRadius: 15 }}
                style={styles.bottomMusicImage}
              />
              <View style={styles.bottomMusicInfo}>
                <Text style={styles.bottomMusicText} numberOfLines={1}>
                  {trackInfo.mode.charAt(0).toUpperCase() +
                    trackInfo.mode.slice(1)}
                </Text>
                <Text style={styles.bottomMusicHeader} numberOfLines={1}>
                  {trackInfo.title}
                </Text>
                <View style={styles.bottomMusicArtistContainer}>
                  <Svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 13"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <Path
                      d="M6 0.5C2.7 0.5 0 3.2 0 6.5C0 9.8 2.7 12.5 6 12.5C9.3 12.5 12 9.8 12 6.5C12 3.2 9.33 0.5 6 0.5ZM8.7605 9.17C8.6405 9.3495 8.4305 9.41 8.25 9.29C6.84 8.42 5.07 8.2395 2.9695 8.7195C2.7605 8.7805 2.58 8.63 2.52 8.45C2.46 8.2395 2.61 8.06 2.79 8C5.07 7.4895 7.05 7.7 8.61 8.66C8.82 8.75 8.8495 8.9895 8.7605 9.17ZM9.4805 7.52C9.33 7.73 9.06 7.82 8.8495 7.67C7.23 6.68 4.77 6.38 2.88 6.98C2.6405 7.04 2.37 6.92 2.31 6.68C2.25 6.44 2.37 6.1695 2.61 6.1095C4.8 5.45 7.5 5.7805 9.36 6.92C9.5405 7.0105 9.63 7.31 9.4805 7.52ZM9.5405 5.84C7.62 4.7 4.41 4.58 2.58 5.1505C2.28 5.24 1.98 5.06 1.89 4.79C1.8 4.4895 1.98 4.19 2.25 4.0995C4.38 3.4695 7.89 3.5895 10.1105 4.91C10.38 5.06 10.47 5.42 10.32 5.69C10.1705 5.9005 9.81 5.9895 9.5405 5.84Z"
                      fill={theme.text}
                    />
                  </Svg>
                  <Text
                    style={[styles.bottomMusicText, { fontSize: 11 }]}
                    numberOfLines={1}
                  >
                    {trackInfo.artist} • {trackInfo.album}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.bottomMusicPlayGroupContainer}>
              <Pressable
                style={styles.bottomMusicButton}
                onPress={() => console.log("groups")}
              >
                <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <Path
                    d="M22.75 1.25H12.25C11.0125 1.25 10 2.2625 10 3.5V21.5C10 22.7375 11.0125 23.7375 12.25 23.7375L22.75 23.75C23.9875 23.75 25 22.7375 25 21.5V3.5C25 2.2625 23.9875 1.25 22.75 1.25ZM17.5 3.75C18.875 3.75 20 4.8625 20 6.25C20 7.6375 18.875 8.75 17.5 8.75C16.125 8.75 15 7.6375 15 6.25C15 4.8625 16.125 3.75 17.5 3.75ZM17.5 20.625C14.7375 20.625 12.5 18.3875 12.5 15.625C12.5 12.8625 14.7375 10.625 17.5 10.625C20.2625 10.625 22.5 12.8625 22.5 15.625C22.5 18.3875 20.2625 20.625 17.5 20.625Z"
                    fill={theme.text}
                  />
                  <Path
                    d="M17.5 18.75C19.2259 18.75 20.625 17.3509 20.625 15.625C20.625 13.8991 19.2259 12.5 17.5 12.5C15.7741 12.5 14.375 13.8991 14.375 15.625C14.375 17.3509 15.7741 18.75 17.5 18.75Z"
                    fill={theme.text}
                  />
                  <Path
                    d="M7.5 6.25H5V26.25C5 27.625 6.1125 28.75 7.5 28.75H20V26.25H7.5V6.25Z"
                    fill={theme.text}
                  />
                </Svg>
              </Pressable>
              <Pressable
                style={styles.bottomMusicButton}
                onPress={() => sendControl("play_pause")}
              >
                {isPlaying ? (
                  // PAUSE ICON
                  <Svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ transform: [{ scale: 2 }] }}
                  >
                    <Path
                      d="M9 6a1 1 0 0 1 1 1v10a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1zm6 0a1 1 0 0 1 1 1v10a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1z"
                      fill={theme.text}
                    />
                  </Svg>
                ) : (
                  // PLAY ICON
                  <Svg
                    width="20"
                    height="24"
                    viewBox="0 0 20 24"
                    fill="none"
                    style={{ marginLeft: 3 }}
                  >
                    <Path
                      d="M3.01234 23.6664C2.35391 24.0859 1.68691 24.1098 1.01136 23.738C0.33712 23.3675 0 22.795 0 22.0205V1.98002C0 1.20551 0.33712 0.63237 1.01136 0.260604C1.68691 -0.109871 2.35391 -0.0853449 3.01234 0.334183L19.1111 10.3544C19.7037 10.7417 20 11.2903 20 12.0003C20 12.7102 19.7037 13.2589 19.1111 13.6461L3.01234 23.6664Z"
                      fill={theme.text}
                    />
                  </Svg>
                )}
              </Pressable>
            </View>
          </View>
          <View style={styles.bottomMusicSliderContainer}>
            <Svg width="9" height="15" viewBox="0 0 9 15" fill="none">
              <Path
                d="M1 10.5002C0.716667 10.5002 0.479 10.4042 0.287 10.2122C0.0956668 10.0209 0 9.78355 0 9.50021V5.50021C0 5.21688 0.0956668 4.97921 0.287 4.78721C0.479 4.59588 0.716667 4.50021 1 4.50021H4L7.3 1.20021C7.61667 0.883546 7.979 0.812547 8.387 0.987213C8.79567 1.16255 9 1.47521 9 1.92521V13.0752C9 13.5252 8.79567 13.8375 8.387 14.0122C7.979 14.1875 7.61667 14.1169 7.3 13.8002L4 10.5002H1Z"
                fill={theme.text}
              />
            </Svg>
            <Slider
              minimumValue={0}
              maximumValue={100}
              step={1}
              containerStyle={styles.volumeSlider}
              maximumTrackTintColor={theme.quinary}
              minimumTrackTintColor={theme.primary}
              onValueChange={(val) =>
                setVolume(Array.isArray(val) ? val[0] : val)
              } // Smooth local update
              onSlidingComplete={handleVolumeChange} // API Call on release
              thumbStyle={styles.volumeSliderThumb}
              trackStyle={styles.volumeSliderTrack}
              value={volume}
            />
            <Svg width="18" height="17" viewBox="0 0 18 17" fill="none">
              <Path
                d="M12.35 16.825C12.0167 16.9583 11.7083 16.9167 11.425 16.7C11.1417 16.4833 11 16.1833 11 15.8C11 15.6167 11.0543 15.4543 11.163 15.313C11.271 15.171 11.4083 15.0667 11.575 15C12.9083 14.4667 13.9793 13.6167 14.788 12.45C15.596 11.2833 16 9.96667 16 8.50001C16 7.03334 15.596 5.71667 14.788 4.55001C13.9793 3.38334 12.9083 2.53334 11.575 2.00001C11.3917 1.93334 11.25 1.82501 11.15 1.67501C11.05 1.52501 11 1.35834 11 1.17501C11 0.80834 11.1417 0.516673 11.425 0.300006C11.7083 0.0833397 12.0167 0.0416731 12.35 0.175006C14.05 0.85834 15.4167 1.95001 16.45 3.45001C17.4833 4.95001 18 6.63334 18 8.50001C18 10.3667 17.4833 12.05 16.45 13.55C15.4167 15.05 14.05 16.1417 12.35 16.825ZM1 11.525C0.716667 11.525 0.479333 11.429 0.288 11.237C0.0960001 11.0457 0 10.8083 0 10.525V6.52501C0 6.24167 0.0960001 6.00401 0.288 5.81201C0.479333 5.62067 0.716667 5.52501 1 5.52501H4L7.3 2.22501C7.61667 1.90834 7.979 1.83734 8.387 2.01201C8.79567 2.18734 9 2.50001 9 2.95001V14.1C9 14.55 8.79567 14.8623 8.387 15.037C7.979 15.2123 7.61667 15.1417 7.3 14.825L4 11.525H1ZM11 12.525V4.47501C11.75 4.82501 12.354 5.36667 12.812 6.10001C13.2707 6.83334 13.5 7.64167 13.5 8.52501C13.5 9.40834 13.2707 10.2083 12.812 10.925C12.354 11.6417 11.75 12.175 11 12.525Z"
                fill={theme.text}
              />
            </Svg>
          </View>
        </View>
        <ScrollView
          style={styles.bottomExpandedContainer}
          contentContainerStyle={{ gap: 10 }}
        >
          <View style={styles.bottomExpandedProgress}>
            <Progress.Bar
              progress={trackPosition / trackInfo.duration || 0}
              width={null}
              height={10}
              color={theme.primary}
              borderRadius={15}
            />
            <View style={styles.bottomExpandedProgressTimeContainer}>
              <View style={{ alignSelf: "flex-start" }}>
                <Text style={styles.bottomExpandedText}>
                  {formatTime(trackPosition)}
                </Text>
              </View>
              <View style={{ alignSelf: "flex-start" }}>
                <Text style={styles.bottomExpandedText}>
                  {formatTime(trackInfo.duration)}
                </Text>
              </View>
            </View>
            <View style={styles.bottomExpandedProgressControls}>
              <Pressable
                style={styles.bottomMusicButton}
                onPress={() => sendControl("prev")}
              >
                <Svg width="24" height="23" viewBox="0 0 24 23" fill="none">
                  <Path
                    d="M1.84615 22.1538C1.32308 22.1538 0.884308 21.9766 0.529846 21.6222C0.176616 21.2689 0 20.8308 0 20.3077V1.84615C0 1.32308 0.176616 0.884308 0.529846 0.529846C0.884308 0.176616 1.32308 0 1.84615 0C2.36923 0 2.808 0.176616 3.16246 0.529846C3.51569 0.884308 3.69231 1.32308 3.69231 1.84615V20.3077C3.69231 20.8308 3.51569 21.2689 3.16246 21.6222C2.808 21.9766 2.36923 22.1538 1.84615 22.1538ZM21.1385 20.2615L9.69231 12.6C9.13846 12.2308 8.86154 11.7231 8.86154 11.0769C8.86154 10.4308 9.13846 9.92308 9.69231 9.55385L21.1385 1.89231C21.7538 1.49231 22.3846 1.46892 23.0308 1.82215C23.6769 2.17662 24 2.72308 24 3.46154V18.6923C24 19.4308 23.6769 19.9846 23.0308 20.3538C22.3846 20.7231 21.7538 20.6923 21.1385 20.2615Z"
                    fill={theme.text}
                  />
                </Svg>
              </Pressable>
              <Pressable
                style={styles.bottomMusicButton}
                onPress={() => sendControl("play_pause")}
              >
                {isPlaying ? (
                  // PAUSE ICON
                  <Svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ transform: [{ scale: 2 }] }}
                  >
                    <Path
                      d="M9 6a1 1 0 0 1 1 1v10a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1zm6 0a1 1 0 0 1 1 1v10a1 1 0 1 1-2 0V7a1 1 0 0 1 1-1z"
                      fill={theme.text}
                    />
                  </Svg>
                ) : (
                  // PLAY ICON
                  <Svg
                    width="20"
                    height="24"
                    viewBox="0 0 20 24"
                    fill="none"
                    style={{ marginLeft: 3 }}
                  >
                    <Path
                      d="M3.01234 23.6664C2.35391 24.0859 1.68691 24.1098 1.01136 23.738C0.33712 23.3675 0 22.795 0 22.0205V1.98002C0 1.20551 0.33712 0.63237 1.01136 0.260604C1.68691 -0.109871 2.35391 -0.0853449 3.01234 0.334183L19.1111 10.3544C19.7037 10.7417 20 11.2903 20 12.0003C20 12.7102 19.7037 13.2589 19.1111 13.6461L3.01234 23.6664Z"
                      fill={theme.text}
                    />
                  </Svg>
                )}
              </Pressable>
              <Pressable
                style={styles.bottomMusicButton}
                onPress={() => sendControl("next")}
              >
                <Svg width="25" height="23" viewBox="0 0 25 23" fill="none">
                  <Path
                    d="M22.6538 22.1538C22.1308 22.1538 21.6926 21.9766 21.3394 21.6222C20.9849 21.2689 20.8077 20.8308 20.8077 20.3077V1.84615C20.8077 1.32308 20.9849 0.884308 21.3394 0.529846C21.6926 0.176616 22.1308 0 22.6538 0C23.1769 0 23.6151 0.176616 23.9683 0.529846C24.3228 0.884308 24.5 1.32308 24.5 1.84615V20.3077C24.5 20.8308 24.3228 21.2689 23.9683 21.6222C23.6151 21.9766 23.1769 22.1538 22.6538 22.1538ZM3.36154 20.2615C2.74615 20.6923 2.11538 20.7231 1.46923 20.3538C0.823077 19.9846 0.5 19.4308 0.5 18.6923V3.46154C0.5 2.72308 0.823077 2.17662 1.46923 1.82215C2.11538 1.46892 2.74615 1.49231 3.36154 1.89231L14.8077 9.55385C15.3615 9.92308 15.6385 10.4308 15.6385 11.0769C15.6385 11.7231 15.3615 12.2308 14.8077 12.6L3.36154 20.2615Z"
                    fill={theme.text}
                  />
                </Svg>
              </Pressable>
            </View>
          </View>
          <View style={styles.bottomExpandedGroupsContainerWrapper}>
            <Text style={styles.bottomExpandedGroupsText}>
              {language.homeScreen.deviceSelection}
            </Text>
            <ScrollView
              style={styles.bottomExpandedGroupsContainer}
              horizontal={true}
              contentContainerStyle={{
                alignItems: "center",
                gap: 10,
                alignItems: "center",
              }}
            >
              {devicesList.map((device) => (
                <GroupPressable
                  key={device.id}
                  style={styles.bottomExpandedGroup}
                >
                  <Text style={styles.bottomExpandedText}>{device.name}</Text>
                </GroupPressable>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
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
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
      width: "auto",
    },
    text: {
      fontFamily: "Inter Thin",
      color: theme.white,
      fontSize: 24,
      fontWeight: 700,
    },
    volumeSlider: {
      width: "80%",
    },
    volumeSliderThumb: {
      width: 10,
      height: 10,
      backgroundColor: theme.primary,
      borderRadius: 60,
    },
    volumeSliderTrack: {
      height: 2,
      borderRadius: 15,
    },
    buttonContainer: {
      padding: 10,
      width: "100%",
    },
    dropDown: {
      width: "100%",
      height: "100%",
      backgroundColor: "#00000060",
      position: "absolute",
      top: 80,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1,
    },
    dropDownMenu: {
      width: "100%",
      padding: 10,
      gap: 10,
      backgroundColor: theme.black,
      alignItems: "center",
    },
    dropDownButton: {
      width: "100%",
      height: 60,
      backgroundColor: theme.secondary,
      borderRadius: 60,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    dropDownButtonText: {
      fontSize: 24,
      color: theme.white,
    },
    bottomPlayerContainer: {
      width: "100%",
      height: 130,
      backgroundColor: theme.secondary,
      borderRadius: 35,
      paddingHorizontal: 20,
      paddingTop: 5,
      paddingBottom: 10,
      justifyContent: "space-between",
      flexDirection: "column",
    },
    bottomMusicContainer: {
      width: "100%",
      height: 70,
      paddingTop: 10,
      gap: 10,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    bottomMusicPlayGroupContainer: {
      gap: 10,
      flexDirection: "row",
    },
    bottomMusicImage: {
      width: 60,
      height: 60,
    },
    bottomMusicText: {
      fontFamily: "Inter Thin",
      color: theme.text,
      fontSize: 14,
      fontWeight: 700,
      width: "100%",
    },
    bottomMusicHeader: {
      fontFamily: "Inter Thin",
      color: theme.white,
      fontSize: 16,
      fontWeight: 700,
      width: "100%",
    },
    bottomMusicInfo: {
      maxWidth: 150,
      height: "100%",
      justifyContent: "space-between",
    },
    bottomMusicArtistContainer: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    bottomMusicButton: {
      width: 50,
      height: 50,
      borderRadius: 60,
      backgroundColor: theme.quartiary,
      justifyContent: "center",
      alignItems: "center",
    },
    bottomMusicSliderContainer: {
      width: "100%",
      height: 30,
      justifyContent: "space-between",
      alignItems: "center",
      flexDirection: "row",
    },
    bottomExpandedContainer: {
      width: "100%",
    },
    bottomExpandedProgress: {
      backgroundColor: theme.secondary,
      width: "100%",
      borderRadius: 35,
      justifyContent: "center",
      padding: 20,
      gap: 5,
    },
    bottomExpandedProgressControls: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "center",
      gap: 20,
    },
    bottomExpandedProgressTimeContainer: {
      width: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
    },
    bottomExpandedText: {
      fontFamily: "Inter Thin",
      color: theme.text,
      fontSize: 14,
      fontWeight: 700,
      textAlign: "center",
    },
    bottomExpandedGroupsContainerWrapper: {
      backgroundColor: theme.secondary,
      width: "100%",
      borderRadius: 35,
      padding: 20,
      gap: 5,
    },
    bottomExpandedGroupsContainer: {
      width: "100%",
      gap: 5,
    },
    bottomExpandedGroupsText: {
      fontFamily: "Inter Thin",
      color: theme.white,
      fontSize: 18,
      fontWeight: 700,
    },
    bottomExpandedGroup: {
      width: 100,
      height: 100,
      backgroundColor: theme.tertiary,
      borderRadius: 15,
      borderColor: theme.quinary,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
      padding: 5,
    },
    textDivider: {
      fontFamily: "Inter Thin",
      color: theme.text,
      textDecorationLine: "underline",
      fontSize: 20,
      textAlign: "center",
    },
    logo: {
      height: 338 / 16,
      width: 1390 / 16,
    },
  });
}

export default HomeScreen;
