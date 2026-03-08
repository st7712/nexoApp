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
import Svg, { Path } from "react-native-svg";
import { useNavigation, CommonActions } from "@react-navigation/native"; // Import useNavigation hook
import { SafeAreaView } from "react-native-safe-area-context";

import {
  saveTheme,
  getTheme,
  getLanguage,
  saveLanguage,
} from "../../assets/js/StorageHandler";
import { lightTheme, darkTheme } from "../../assets/js/colors";
import { english, czech } from "../../assets/js/text";
import MultiSelectGroupItem from "../../assets/js/MultiSelectGroupItem";

let styles;

function SettingsScreen(props) {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true); // Loading state
  let [theme, setTheme] = useState(darkTheme); // Default to dark theme
  let [language, setLanguage] = useState(english); // Default to English

  const groupsData = [
    {
      title: language.settings.langSelect,
      options: [language.settings.english, language.settings.czech],
    },
    {
      title: language.settings.themeSelect,
      options: [language.settings.darkTheme, language.settings.lightTheme],
    },
    // Add more groups as needed
  ];

  const initialSelections = {};
  groupsData.forEach((group) => {
    initialSelections[group.title] = group.options[0].toLowerCase();
  });

  const [selections, setSelections] = useState(initialSelections);

  function updateSelections() {
    let currentSelect = selections;
    getTheme().then((theme) => {
      if (theme === "light") {
        currentSelect["Theme"] = "light";
        currentSelect["Motiv"] = "světlý";
      } else if (theme === "dark") {
        currentSelect["Theme"] = "dark";
        currentSelect["Motiv"] = "tmavý";
      }
      setSelections({ ...currentSelect });
    });

    getLanguage().then((language) => {
      if (language === "english") {
        currentSelect["Jazyk"] = "angličtina";
        currentSelect["Language"] = "english";
      } else if (language === "czech") {
        currentSelect["Jazyk"] = "čeština";
        currentSelect["Language"] = "czech";
      }
      setSelections({ ...currentSelect });
    });
  }

  async function handleSaveTheme(theme) {
    await saveTheme(theme);
    setTheme(theme === "dark" ? darkTheme : lightTheme);
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

  async function handleSaveLanguage(language) {
    await saveLanguage(language);
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

  // Handler to update selection
  const handleSelect = (groupTitle, selectedOption) => {
    let currentSelect = selections;
    if (groupTitle === language.settings.langSelect) {
      if (selectedOption === language.settings.english) {
        currentSelect["Jazyk"] = "angličtina";
        currentSelect["Language"] = "english";
      } else if (selectedOption === language.settings.czech) {
        currentSelect["Jazyk"] = "čeština";
        currentSelect["Language"] = "czech";
      }
    }
    if (groupTitle === language.settings.themeSelect) {
      if (selectedOption === language.settings.lightTheme) {
        currentSelect["Theme"] = "light";
        currentSelect["Motiv"] = "světlý";
      } else if (selectedOption === language.settings.darkTheme) {
        currentSelect["Theme"] = "dark";
        currentSelect["Motiv"] = "tmavý";
      }
    }
    setSelections({ ...currentSelect });

    // Perform any additional actions based on selection
    if (groupTitle === language.settings.themeSelect) {
      // Example: Toggle theme
      // toggleTheme(selectedOption);
      console.log("Theme changed to", selectedOption);
      if (selectedOption === language.settings.darkTheme) {
        handleSaveTheme("dark");
        fetchTheme();
      } else {
        handleSaveTheme("light");
        fetchTheme();
      }
    } else if (groupTitle === language.settings.langSelect) {
      if (selectedOption === language.settings.czech) {
        handleSaveLanguage("czech");
        fetchTheme();
      } else if (selectedOption === language.settings.english) {
        handleSaveLanguage("english");
        fetchTheme();
      }
      fetchLanguage();
      // Example: Change language
      // changeLanguage(selectedOption);
      console.log("Language changed to", selectedOption);
    }
  };

  useEffect(() => {
    fetchLanguage();
    fetchTheme();
    updateSelections();
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
          <Text style={styles.text}>{language.settings.headerTitle}</Text>
        </Pressable>
      </View>
      <ScrollView
        style={styles.buttonContainerOut}
        contentContainerStyle={styles.buttonContainer}
      >
        {groupsData.map((group, index) => (
          <MultiSelectGroupItem
            key={index}
            title={group.title}
            options={group.options}
            selectedOption={selections[group.title]}
            onSelect={handleSelect}
            theme={theme}
          />
        ))}
        <View style={styles.button}>
          <Pressable
            style={styles.pressableWindow}
            onPress={() => console.log("Help")}
          />
          <View style={styles.textIconWrapper}>
            <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <Path
                d="M15 28C22.1797 28 28 22.1797 28 15C28 7.8203 22.1797 2 15 2C7.8203 2 2 7.8203 2 15C2 22.1797 7.8203 28 15 28Z"
                stroke={theme.text}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M11.3625 11.25C11.6564 10.4146 12.2364 9.71014 12.9999 9.26143C13.7634 8.81271 14.6611 8.64868 15.534 8.7984C16.4068 8.94812 17.1985 9.40192 17.7688 10.0794C18.3392 10.7569 18.6513 11.6144 18.65 12.5C18.65 15 14.9 16.25 14.9 16.25"
                stroke={theme.text}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M15 21.25H15.0125"
                stroke={theme.text}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.buttonText}>{language.settings.help}</Text>
          </View>
        </View>
        <View style={styles.button}>
          <Pressable
            style={styles.pressableWindow}
            onPress={() => console.log("About")}
          />
          <View style={styles.textIconWrapper}>
            <Svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <Path
                d="M13.75 8.75H16.25V11.25H13.75V8.75ZM13.75 13.75H16.25V21.25H13.75V13.75ZM15 2.5C8.1 2.5 2.5 8.1 2.5 15C2.5 21.9 8.1 27.5 15 27.5C21.9 27.5 27.5 21.9 27.5 15C27.5 8.1 21.9 2.5 15 2.5ZM15 25C9.4875 25 5 20.5125 5 15C5 9.4875 9.4875 5 15 5C20.5125 5 25 9.4875 25 15C25 20.5125 20.5125 25 15 25Z"
                fill={theme.text}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.buttonText}>{language.settings.about}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme) {
  const styles = StyleSheet.create({
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
    pressableWindow: {
      position: "absolute",
      width: "100%",
      height: "100%",
      zIndex: 1,
    },
    rotatedArrow: {
      transform: [{ rotate: "180deg" }],
    },
  });
  return styles;
}

export default SettingsScreen;
