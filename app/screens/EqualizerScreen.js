import {
  Pressable,
  StyleSheet,
  View,
  Text,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { Slider } from "@miblanchard/react-native-slider";
import { useNavigation, CommonActions } from "@react-navigation/native"; // Import useNavigation hook
import { useEffect, useState } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { getTheme, getLanguage, getNexoAPI } from "../assets/js/StorageHandler";
import { darkTheme, lightTheme } from "../assets/js/colors";
import { english, czech } from "../assets/js/text";

let styles;

function EqualizerScreen() {
  const navigation = useNavigation();
  let [theme, setTheme] = useState(darkTheme);
  const [loading, setLoading] = useState(true); // Loading state
  let [language, setLanguage] = useState(english);
  const [nexoAPI, setNexoAPI] = useState("");
  const [eqValues, setEqValues] = useState({ bass: 0, treble: 0 });

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
    if (savedLanguage === "english") {
      setLanguage(english);
    } else if (savedLanguage === "czech") {
      setLanguage(czech);
    }
  }

  async function fetchNexoAPI() {
    const savedNexoAPI = await getNexoAPI();
    if (savedNexoAPI) {
      setNexoAPI(savedNexoAPI);
    }
  }

  async function fetchEQValues() {
    try {
      const response = await fetch(`${nexoAPI}/control/eq`);
      const data = await response.json();
      setEqValues({ bass: data.bass, treble: data.treble });
    } catch (error) {
      console.error("Fetch EQ Values Error:", error);
    }
  }

  useEffect(() => {
    fetchLanguage();
    fetchTheme();
    fetchNexoAPI();
  }, []);

  // Fetch EQ values when nexoAPI is available
  useEffect(() => {
    if (nexoAPI) {
      fetchEQValues();
    }
  }, [nexoAPI]);

  const handleEQchange = async (type, val) => {
    const presetValue = Array.isArray(val) ? val[0] : val;
    console.log(`Setting ${type} to ${presetValue}`);
    try {
      await fetch(`${nexoAPI}/control/eq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ band_type: type, preset: String(presetValue) }),
      });
    } catch (error) {
      console.error("EQ Error:", error);
    }
  };

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
            style={styles.rotatedArrow} // Apply the animated rotation style
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
          <Text style={[styles.text, { fontWeight: 700, fontSize: 24 }]}>
            {language.equalizerScreen.headerTitle}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.mainContainer}
        contentContainerStyle={{ alignItems: "center", gap: 10 }}
      >
        <View style={styles.sliderContainer}>
          <Text style={styles.text}>{language.equalizerScreen.bass}</Text>
          <Slider
            minimumValue={-6}
            maximumValue={6}
            step={1}
            containerStyle={styles.volumeSlider}
            maximumTrackTintColor={theme.quinary}
            minimumTrackTintColor={theme.primary}
            thumbStyle={styles.volumeSliderThumb}
            trackStyle={styles.volumeSliderTrack}
            value={eqValues.bass}
            onValueChange={(val) =>
              setEqValues((prev) => ({
                ...prev,
                bass: Array.isArray(val) ? val[0] : val,
              }))
            } // Smooth local update
            onSlidingComplete={(value) => handleEQchange("bass", value)}
          />
          <View style={styles.textContainer}>
            <Text style={styles.textContainerText}>-6</Text>
            <Text style={styles.textContainerText}>-5</Text>
            <Text style={styles.textContainerText}>-4</Text>
            <Text style={styles.textContainerText}>-3</Text>
            <Text style={styles.textContainerText}>-2</Text>
            <Text style={styles.textContainerText}>-1</Text>
            <Text style={styles.textContainerText}>0</Text>
            <Text style={styles.textContainerText}>1</Text>
            <Text style={styles.textContainerText}>2</Text>
            <Text style={styles.textContainerText}>3</Text>
            <Text style={styles.textContainerText}>4</Text>
            <Text style={styles.textContainerText}>5</Text>
            <Text style={styles.textContainerText}>6</Text>
          </View>
          <View style={styles.circleContainer}>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
          </View>
        </View>
        <View style={styles.sliderContainer}>
          <Text style={styles.text}>{language.equalizerScreen.treble}</Text>
          <Slider
            minimumValue={-6}
            maximumValue={6}
            step={1}
            containerStyle={styles.volumeSlider}
            maximumTrackTintColor={theme.quinary}
            minimumTrackTintColor={theme.primary}
            thumbStyle={styles.volumeSliderThumb}
            trackStyle={styles.volumeSliderTrack}
            value={eqValues.treble}
            onValueChange={(val) =>
              setEqValues((prev) => ({
                ...prev,
                treble: Array.isArray(val) ? val[0] : val,
              }))
            } // Smooth local update
            onSlidingComplete={(value) => handleEQchange("treble", value)}
          />
          <View style={styles.textContainer}>
            <Text style={styles.textContainerText}>-6</Text>
            <Text style={styles.textContainerText}>-5</Text>
            <Text style={styles.textContainerText}>-4</Text>
            <Text style={styles.textContainerText}>-3</Text>
            <Text style={styles.textContainerText}>-2</Text>
            <Text style={styles.textContainerText}>-1</Text>
            <Text style={styles.textContainerText}>0</Text>
            <Text style={styles.textContainerText}>1</Text>
            <Text style={styles.textContainerText}>2</Text>
            <Text style={styles.textContainerText}>3</Text>
            <Text style={styles.textContainerText}>4</Text>
            <Text style={styles.textContainerText}>5</Text>
            <Text style={styles.textContainerText}>6</Text>
          </View>
          <View style={styles.circleContainer}>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
            <Svg width="5" height="5" viewBox="0 0 5 4" fill="none">
              <Circle cx="2.40002" cy="2.00012" r="2" fill={theme.text} />
            </Svg>
          </View>
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
      paddingHorizontal: 20,
      paddingTop: 20,
      zIndex: 2,
    },
    mainContainer: {
      width: "100%",
      flex: 1,
      padding: 10,
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
      fontSize: 20,
      fontWeight: 400,
    },
    volumeSlider: {
      width: 350,
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
    rotatedArrow: {
      transform: [{ rotate: "180deg" }],
    },
    sliderContainer: {
      width: "100%",
      padding: 10,
      gap: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.secondary,
      borderRadius: 30,
    },
    textContainer: {
      flexDirection: "row",
      gap: (350 - 240) / 13,
    },
    textContainerText: {
      color: theme.textdark,
      fontSize: 16,
      fontFamily: "Inter Thin",
      width: 20,
      textAlign: "center",
    },
    circleContainer: {
      flexDirection: "row",
      gap: (350 - 50) / 13,
      position: "absolute",
      top: 67,
    },
  });
}

export default EqualizerScreen;
