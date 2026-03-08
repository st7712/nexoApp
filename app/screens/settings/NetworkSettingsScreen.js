import React, { useState, useEffect, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import {
  useNavigation,
  CommonActions,
  useFocusEffect,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { darkTheme, lightTheme } from "../../assets/js/colors";
import {
  getTheme,
  getLanguage,
  getNexoAPI,
} from "../../assets/js/StorageHandler";
import { english, czech } from "../../assets/js/text";

let styles;

function NetworkSettingsScreen(props) {
  const navigation = useNavigation();
  let [theme, setTheme] = useState(darkTheme);
  const [loading, setLoading] = useState(true);
  let [language, setLanguage] = useState(english);
  const [currentSSID, setCurrentSSID] = useState("");
  const [availableNetworks, setAvailableNetworks] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [ssidExists, setSSIDExists] = useState(false);
  const [nexoAPI, setNexoAPI] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSSID, setWifiSSID] = useState("");

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
    setLoading(false);
  }

  async function fetchLanguage() {
    const savedLanguage = await getLanguage();
    console.log(savedLanguage);
    if (savedLanguage === "english") {
      setLanguage(english);
    } else if (savedLanguage === "czech") {
      setLanguage(czech);
    }
  }

  async function fetchSSID() {
    if (!nexoAPI) return;
    try {
      const response = await fetch(`${nexoAPI}/network/ssid`);
      const data = await response.json();
      setCurrentSSID(data.ssid || null);
    } catch (error) {
      console.log("Fetch SSID Error:", error);
    }
  }

  // Fetch available WiFi networks from API
  const scanNetworks = async () => {
    setIsScanning(true);
    try {
      const res = await fetch(`${nexoAPI}/network/scan`);
      const data = await res.json();

      // Expect array like: [{ ssid: string, level: number }, ...]
      const list = Array.isArray(data) ? data : data?.networks || [];

      const normalized = list
        .map((n) => {
          const rawLevel = n?.level ?? n?.signal;
          const parsed = Number(rawLevel);
          const level = Number.isFinite(parsed) ? parsed : -100; // force numeric even if API returns strings
          return {
            ssid: n?.ssid || n?.SSID || "",
            level,
          };
        })
        .filter((n) => n.ssid && n.ssid !== "<unknown ssid>")
        .sort((a, b) => b.level - a.level);

      console.log(
        "Scanned networks:",
        normalized.map((n) => `${n.ssid} (${n.level})`).join(", ")
      );

      setAvailableNetworks(normalized);
      setSSIDExists(
        currentSSID ? normalized.some((n) => n.ssid === currentSSID) : false
      );
    } catch (error) {
      console.log("Error fetching networks from API:", error);
      setAvailableNetworks([]);
      setSSIDExists(false);
    } finally {
      setIsScanning(false);
    }
  };

  // Get signal strength icon based on RSSI level
  const getSignalIcon = (level) => {
    if (level >= 80) {
      return "full"; // Excellent
    } else if (level >= 70) {
      return "full"; // Very Good
    } else if (level >= 60) {
      return "two"; // Good
    } else if (level >= 40) {
      return "one"; // Poor
    } else {
      return "empty"; // Bad
    }
  };

  // Get signal strength label
  const getSignalLabel = (level) => {
    if (level >= 80) {
      return language.networkSettings?.connections?.excellent || "Excellent";
    } else if (level >= 70) {
      return language.networkSettings?.connections?.veryGood || "Very Good";
    } else if (level >= 60) {
      return language.networkSettings?.connections?.good || "Good";
    } else if (level >= 40) {
      return language.networkSettings?.connections?.poor || "Poor";
    } else {
      return language.networkSettings?.connections?.bad || "Bad";
    }
  };

  // Connect to a WiFi network
  const connectToNetwork = async () => {
    try {
      // Tell backend which SSID to use
      await fetch(`${nexoAPI}/network/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ssid: wifiSSID, password: wifiPassword }),
      });

      // Save locally
      await saveSSID(wifiSSID);
      setCurrentSSID(wifiSSID);
      setSSIDExists(availableNetworks.some((n) => n.ssid === wifiSSID));
      console.log(`Requested connect to ${wifiSSID}`);
      setModalVisible(false);
    } catch (error) {
      console.log("Error connecting to network:", error);
      setModalVisible(false);
    }
  };

  async function handleNetworkSelect(ssid) {
    setWifiSSID(ssid);
    setModalVisible(true);
  }

  async function fetchNexoAPIBase() {
    const savedAPI = await getNexoAPI();
    if (savedAPI) {
      setNexoAPI(savedAPI);
    }
  }

  useEffect(() => {
    fetchLanguage();
    fetchTheme();
    fetchNexoAPIBase();
  }, []);

  useEffect(() => {
    if (nexoAPI) {
      fetchSSID();
      scanNetworks();
    }
  }, [nexoAPI]);

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

  const FullSvg = () => {
    return (
      <Svg width="30" height="22" viewBox="0 0 30 22" fill="none">
        <Path
          d="M1.36026 8.54863C0.295835 8.18096 -0.268944 6.97835 0.126485 5.92146C0.289269 5.48642 0.576614 5.17056 1.33828 4.58942C4.70424 2.02129 8.77616 0.435464 12.9661 0.0609732C13.8753 -0.0203244 16.0526 -0.0203244 16.9618 0.0609732C21.2992 0.448654 25.7202 2.23187 28.9829 4.90974C29.502 5.33582 29.6959 5.60774 29.8441 6.1174C29.9813 6.58922 29.9319 7.03915 29.6889 7.53283C29.3419 8.23768 28.6985 8.63417 27.904 8.63267C27.3122 8.63167 27.0692 8.52125 26.204 7.86102C24.4318 6.50852 22.6346 5.56732 20.5306 4.88982C17.5037 3.91517 14.097 3.7638 10.9375 4.46356C8.30844 5.04583 6.01774 6.11544 3.75773 7.81602C2.607 8.68189 2.1502 8.82148 1.36026 8.54863Z"
          fill={theme.text}
        />
        <Path
          d="M6.39035 13.9579C7.09957 14.6706 8.21406 14.7434 9.03907 14.1469C12.5707 11.6306 17.3182 11.6306 20.8498 14.1469C21.6748 14.7288 22.7893 14.6706 23.4985 13.9579L23.5129 13.9435C24.3813 13.0707 24.3234 11.5871 23.3247 10.8744C18.3457 7.25256 11.5574 7.25256 6.56392 10.8744C5.56522 11.6016 5.50745 13.0706 6.39035 13.9579Z"
          fill={theme.text}
        />
        <Path
          d="M11.786 19.3925L13.9137 21.5306C14.4782 22.0979 15.39 22.0979 15.9545 21.5306L18.0822 19.3925C18.7624 18.7088 18.6177 17.5306 17.7493 17.0797C15.9834 16.1634 13.8703 16.1634 12.09 17.0797C11.2649 17.5306 11.1057 18.7088 11.786 19.3925Z"
          fill={theme.text}
        />
      </Svg>
    );
  };

  const SignalIconComponent = ({ type }) => {
    switch (type) {
      case "full":
        return <FullSvg />;
      case "two":
        return <TopOneSvg />;
      case "one":
        return <TopTwoSvg />;
      case "empty":
        return <EmptySvg />;
      default:
        return <FullSvg />;
    }
  };

  const TopOneSvg = () => {
    return (
      <Svg width="30" height="22" viewBox="0 -1 30 24" fill="none">
        <Path
          d="M1.36026 8.54863C0.295835 8.18096 -0.268944 6.97835 0.126485 5.92146C0.289269 5.48642 0.576614 5.17056 1.33828 4.58942C4.70424 2.02129 8.77616 0.435464 12.9661 0.0609732C13.8753 -0.0203244 16.0526 -0.0203244 16.9618 0.0609732C21.2992 0.448654 25.7202 2.23187 28.9829 4.90974C29.502 5.33582 29.6959 5.60774 29.8441 6.1174C29.9813 6.58922 29.9319 7.03915 29.6889 7.53283C29.3419 8.23768 28.6985 8.63417 27.904 8.63267C27.3122 8.63167 27.0692 8.52125 26.204 7.86102C24.4318 6.50852 22.6346 5.56732 20.5306 4.88982C17.5037 3.91517 14.097 3.7638 10.9375 4.46356C8.30844 5.04583 6.01774 6.11544 3.75773 7.81602C2.607 8.68189 2.1502 8.82148 1.36026 8.54863Z"
          stroke={theme.text}
        />
        <Path
          d="M6.39035 13.9579C7.09957 14.6706 8.21406 14.7434 9.03907 14.1469C12.5707 11.6306 17.3182 11.6306 20.8498 14.1469C21.6748 14.7288 22.7893 14.6706 23.4985 13.9579L23.5129 13.9435C24.3813 13.0707 24.3234 11.5871 23.3247 10.8744C18.3457 7.25256 11.5574 7.25256 6.56392 10.8744C5.56522 11.6016 5.50745 13.0706 6.39035 13.9579Z"
          fill={theme.text}
        />
        <Path
          d="M11.786 19.3925L13.9137 21.5306C14.4782 22.0979 15.39 22.0979 15.9545 21.5306L18.0822 19.3925C18.7624 18.7088 18.6177 17.5306 17.7493 17.0797C15.9834 16.1634 13.8703 16.1634 12.09 17.0797C11.2649 17.5306 11.1057 18.7088 11.786 19.3925Z"
          fill={theme.text}
        />
      </Svg>
    );
  };

  const TopTwoSvg = () => {
    return (
      <Svg width="30" height="22" viewBox="0 -1 30 24" fill="none">
        <Path
          d="M1.36026 8.54863C0.295835 8.18096 -0.268944 6.97835 0.126485 5.92146C0.289269 5.48642 0.576614 5.17056 1.33828 4.58942C4.70424 2.02129 8.77616 0.435464 12.9661 0.0609732C13.8753 -0.0203244 16.0526 -0.0203244 16.9618 0.0609732C21.2992 0.448654 25.7202 2.23187 28.9829 4.90974C29.502 5.33582 29.6959 5.60774 29.8441 6.1174C29.9813 6.58922 29.9319 7.03915 29.6889 7.53283C29.3419 8.23768 28.6985 8.63417 27.904 8.63267C27.3122 8.63167 27.0692 8.52125 26.204 7.86102C24.4318 6.50852 22.6346 5.56732 20.5306 4.88982C17.5037 3.91517 14.097 3.7638 10.9375 4.46356C8.30844 5.04583 6.01774 6.11544 3.75773 7.81602C2.607 8.68189 2.1502 8.82148 1.36026 8.54863Z"
          stroke={theme.text}
        />
        <Path
          d="M6.39035 13.9579C7.09957 14.6706 8.21406 14.7434 9.03907 14.1469C12.5707 11.6306 17.3182 11.6306 20.8498 14.1469C21.6748 14.7288 22.7893 14.6706 23.4985 13.9579L23.5129 13.9435C24.3813 13.0707 24.3234 11.5871 23.3247 10.8744C18.3457 7.25256 11.5574 7.25256 6.56392 10.8744C5.56522 11.6016 5.50745 13.0706 6.39035 13.9579Z"
          stroke={theme.text}
        />
        <Path
          d="M11.786 19.3925L13.9137 21.5306C14.4782 22.0979 15.39 22.0979 15.9545 21.5306L18.0822 19.3925C18.7624 18.7088 18.6177 17.5306 17.7493 17.0797C15.9834 16.1634 13.8703 16.1634 12.09 17.0797C11.2649 17.5306 11.1057 18.7088 11.786 19.3925Z"
          fill={theme.text}
        />
      </Svg>
    );
  };

  const EmptySvg = () => {
    return (
      <Svg width="30" height="22" viewBox="0 -1 30 24" fill="none">
        <Path
          d="M1.36026 8.54863C0.295835 8.18096 -0.268944 6.97835 0.126485 5.92146C0.289269 5.48642 0.576614 5.17056 1.33828 4.58942C4.70424 2.02129 8.77616 0.435464 12.9661 0.0609732C13.8753 -0.0203244 16.0526 -0.0203244 16.9618 0.0609732C21.2992 0.448654 25.7202 2.23187 28.9829 4.90974C29.502 5.33582 29.6959 5.60774 29.8441 6.1174C29.9813 6.58922 29.9319 7.03915 29.6889 7.53283C29.3419 8.23768 28.6985 8.63417 27.904 8.63267C27.3122 8.63167 27.0692 8.52125 26.204 7.86102C24.4318 6.50852 22.6346 5.56732 20.5306 4.88982C17.5037 3.91517 14.097 3.7638 10.9375 4.46356C8.30844 5.04583 6.01774 6.11544 3.75773 7.81602C2.607 8.68189 2.1502 8.82148 1.36026 8.54863Z"
          stroke={theme.text}
        />
        <Path
          d="M6.39035 13.9579C7.09957 14.6706 8.21406 14.7434 9.03907 14.1469C12.5707 11.6306 17.3182 11.6306 20.8498 14.1469C21.6748 14.7288 22.7893 14.6706 23.4985 13.9579L23.5129 13.9435C24.3813 13.0707 24.3234 11.5871 23.3247 10.8744C18.3457 7.25256 11.5574 7.25256 6.56392 10.8744C5.56522 11.6016 5.50745 13.0706 6.39035 13.9579Z"
          stroke={theme.text}
        />
        <Path
          d="M11.786 19.3925L13.9137 21.5306C14.4782 22.0979 15.39 22.0979 15.9545 21.5306L18.0822 19.3925C18.7624 18.7088 18.6177 17.5306 17.7493 17.0797C15.9834 16.1634 13.8703 16.1634 12.09 17.0797C11.2649 17.5306 11.1057 18.7088 11.786 19.3925Z"
          stroke={theme.text}
        />
      </Svg>
    );
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
            navigation.dispatch(CommonActions.goBack());
          }}
        >
          <Svg
            width="19"
            height="34"
            viewBox="0 0 19 34"
            style={styles.rotatedArrow}
          >
            <Path
              d="M2 32L17 17L2 2"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke={theme.white}
              fillOpacity={0}
            />
          </Svg>
          <Text style={styles.text}>
            {language.networkSettings.headerTitle}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.buttonContainerOut}
        contentContainerStyle={styles.buttonContainer}
      >
        <View style={styles.networkInfoContainer}>
          <View style={styles.networkInfo}>
            <View style={styles.textIconWrapper}>
              <Text
                style={[
                  styles.networkInfoText,
                  { color: theme.white, fontSize: 20 },
                ]}
              >
                {currentSSID ? currentSSID : language.networkSettings.noNetwork}
              </Text>
              <Svg
                width="15"
                height="15"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <Rect
                  width="15"
                  height="15"
                  rx="7.5"
                  fill={ssidExists ? theme.green : theme.red}
                />
              </Svg>
            </View>
          </View>
        </View>
        <Text style={styles.textDivider}>
          {language.networkSettings.differentNetworks}
        </Text>
        {isScanning ? (
          <View style={{ width: "100%", alignItems: "center", padding: 20 }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.networkInfoText, { marginTop: 10 }]}>
              {language.networkSettings.scanning}
            </Text>
          </View>
        ) : availableNetworks.length === 0 ? (
          <View
            style={{
              width: "100%",
              alignItems: "center",
              padding: 20,
              gap: 10,
            }}
          >
            <Text style={[styles.networkInfoText]}>
              {language.networkSettings.notFound}
            </Text>
            <Text
              style={[
                styles.networkInfoText,
                { fontSize: 12, color: theme.text },
              ]}
            >
              {language.networkSettings.refresh}
            </Text>
          </View>
        ) : (
          availableNetworks.map((network, index) => (
            <Pressable
              key={index}
              style={[
                styles.networkButton,
                currentSSID === network.ssid && {
                  backgroundColor: theme.green,
                  borderColor: theme.primary,
                  borderWidth: 2,
                },
              ]}
              onPress={() => handleNetworkSelect(network.ssid)}
            >
              <Text
                style={[
                  styles.networkInfoText,
                  { color: theme.white, fontSize: 20 },
                ]}
                numberOfLines={1}
              >
                {network.ssid}
              </Text>
              <View style={styles.textIconWrapper}>
                <SignalIconComponent type={getSignalIcon(network.level)} />
                <Text style={styles.networkButtonText}>
                  {getSignalLabel(network.level)}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
      <Pressable
        style={styles.scanButton}
        onPress={scanNetworks}
        disabled={isScanning}
      >
        <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M13.7259 0.0543326C16.3148 -0.16661 18.9168 0.288734 21.2769 1.37576C23.637 2.46279 25.6743 4.14422 27.1892 6.25534V3.28141C27.1892 2.90842 27.3374 2.55072 27.6011 2.28698C27.8648 2.02324 28.2225 1.87507 28.5955 1.87507C28.9685 1.87507 29.3262 2.02324 29.59 2.28698C29.8537 2.55072 30.0019 2.90842 30.0019 3.28141V11.2507H22.0326C21.6596 11.2507 21.3019 11.1025 21.0382 10.8387C20.7744 10.575 20.6263 10.2173 20.6263 9.84432C20.6263 9.47133 20.7744 9.11362 21.0382 8.84988C21.3019 8.58615 21.6596 8.43798 22.0326 8.43798H25.2709C23.9886 6.43143 22.1465 4.84448 19.9723 3.87317C17.798 2.90187 15.3869 2.58875 13.0367 2.97251C10.6865 3.35626 8.50021 4.42008 6.74788 6.03254C4.99554 7.645 3.75394 9.73546 3.17645 12.0457C3.13385 12.2272 3.0556 12.3984 2.94625 12.5493C2.83689 12.7003 2.69862 12.828 2.53946 12.9251C2.3803 13.0221 2.20344 13.0865 2.01916 13.1146C1.83488 13.1427 1.64685 13.1339 1.46601 13.0886C1.28518 13.0434 1.11514 12.9626 0.965785 12.8511C0.816433 12.7396 0.690746 12.5994 0.596034 12.4389C0.501321 12.2783 0.439473 12.1005 0.414086 11.9159C0.388699 11.7312 0.400279 11.5433 0.448153 11.3632C1.20672 8.33002 2.89406 5.6097 5.27431 3.58245C7.65457 1.5552 10.6088 0.322344 13.724 0.0562077L13.7259 0.0543326ZM7.35046 27.9036C9.36055 29.095 11.6212 29.8003 13.9521 29.9634C16.2831 30.1265 18.6199 29.7428 20.7763 28.8429C22.9328 27.943 24.8491 26.5518 26.3727 24.7801C27.8963 23.0085 28.9849 20.9054 29.5518 18.6386C29.6363 18.279 29.5758 17.9005 29.3834 17.5851C29.1911 17.2697 28.8824 17.0426 28.524 16.953C28.1656 16.8633 27.7864 16.9183 27.4682 17.106C27.15 17.2937 26.9184 17.599 26.8235 17.9561C26.2457 20.2658 25.0041 22.3558 23.2519 23.9678C21.4997 25.5799 19.3138 26.6434 16.964 27.0271C14.6142 27.4108 12.2034 27.0979 10.0295 26.127C7.85548 25.1561 6.01348 23.5697 4.73092 21.5638H7.96924C8.34223 21.5638 8.69994 21.4156 8.96368 21.1519C9.22742 20.8881 9.37558 20.5304 9.37558 20.1575C9.37558 19.7845 9.22742 19.4268 8.96368 19.163C8.69994 18.8993 8.34223 18.7511 7.96924 18.7511H0V26.7204C0 27.0933 0.148167 27.4511 0.411907 27.7148C0.675646 27.9785 1.03335 28.1267 1.40634 28.1267C1.77932 28.1267 2.13703 27.9785 2.40077 27.7148C2.66451 27.4511 2.81267 27.0933 2.81267 26.7204V23.7464C4.02172 25.4309 5.56682 26.8463 7.35046 27.9036Z"
            fill={theme.white}
          />
        </Svg>
      </Pressable>
      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setWifiPassword("");
          setWifiSSID("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {language.networkSettings.enterPassword} {wifiSSID}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={language.networkSettings.password}
              placeholderTextColor={theme.textdark}
              onChangeText={(text) => setWifiPassword(text)}
              value={wifiPassword}
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={connectToNetwork}
            >
              <Text style={styles.saveButtonText}>
                {language.networkSettings.submit}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    },
    text: {
      fontFamily: "Inter Thin",
      color: theme.white,
      fontSize: 24,
      fontWeight: 700,
    },
    buttonContainerOut: {
      width: "100%",
      padding: 15,
    },
    buttonContainer: {
      alignItems: "center",
      gap: 10,
    },
    networkButton: {
      backgroundColor: theme.secondary,
      width: "100%",
      borderRadius: 20,
      flexDirection: "column",
      alignItems: "flex-start",
      padding: 15,
      gap: 10,
    },
    networkButtonText: {
      fontFamily: "Inter Thin",
      fontSize: 16,
      color: theme.text,
      fontWeight: 800,
    },
    textIconWrapper: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    rotatedArrow: {
      transform: [{ rotate: "180deg" }],
    },
    networkInfoContainer: {
      width: "100%",
      padding: 15,
      backgroundColor: theme.secondary,
      borderRadius: 20,
    },
    networkInfoText: {
      fontFamily: "Inter Thin",
      fontSize: 12,
      color: theme.text,
      fontWeight: 800,
    },
    networkInfo: {
      gap: 10,
    },
    textDivider: {
      fontFamily: "Inter Thin",
      color: theme.text,
      textDecorationLine: "underline",
      fontSize: 20,
    },
    scanButton: {
      position: "absolute",
      bottom: 20,
      right: 20,
      backgroundColor: theme.secondary,
      justifyContent: "center",
      alignItems: "center",
      width: 50,
      height: 50,
      borderRadius: 50,
      borderColor: theme.textdark,
      borderWidth: 2,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "#00000080",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "80%",
      backgroundColor: theme.secondary,
      borderRadius: 15,
      padding: 20,
      alignItems: "center",
    },
    modalTitle: {
      fontFamily: "Inter Thin",
      fontSize: 20,
      color: theme.text,
      marginBottom: 15,
    },
    input: {
      width: "100%",
      height: 40,
      borderColor: theme.tertiary,
      borderWidth: 1,
      borderRadius: 60,
      paddingHorizontal: 15,
      color: theme.text,
      marginBottom: 20,
    },
    saveButton: {
      backgroundColor: theme.green,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 60,
    },
    saveButtonText: {
      color: theme.white,
      fontSize: 16,
      fontWeight: "600",
    },
  });
}

export default NetworkSettingsScreen;
