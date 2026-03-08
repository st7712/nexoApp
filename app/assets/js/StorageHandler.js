import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveNexoID(nexoID) {
  try {
    await AsyncStorage.setItem("@nexoID", nexoID);
    console.log("NexoID saved!");
  } catch (error) {
    console.error("Error saving nexoID", error);
  }
}

export async function getNexoID() {
  try {
    const nexoID = await AsyncStorage.getItem("@nexoID");
    if (nexoID !== null) {
      return nexoID; // Return the nexoID
    } else {
      console.log("No Nexo ID found");
    }
  } catch (error) {
    console.error("Error retrieving nexoID", error);
  }
}

export async function saveNexoAPI(nexoAPI) {
  try {
    await AsyncStorage.setItem("@nexoAPI", nexoAPI);
    console.log("NexoAPI saved!");
  } catch (error) {
    console.error("Error saving nexoAPI", error);
  }
}

export async function getNexoAPI() {
  try {
    const nexoAPI = await AsyncStorage.getItem("@nexoAPI");
    if (nexoAPI !== null) {
      return nexoAPI; // Return the nexoAPI
    } else {
      console.log("No Nexo API found");
    }
  } catch (error) {
    console.error("Error retrieving nexoAPI", error);
  }
}

export async function getTheme() {
  try {
    const theme = await AsyncStorage.getItem("@theme");
    if (theme !== null) {
      return theme; // Return the theme
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error retrieving theme", error);
  }
}

export async function saveTheme(theme) {
  try {
    await AsyncStorage.setItem("@theme", theme);
    console.log("Theme saved!");
  } catch (error) {
    console.error("Error saving theme", error);
  }
}

export async function getLanguage() {
  try {
    const language = await AsyncStorage.getItem("@language");
    if (language !== null) {
      return language;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error retrieving language", error);
  }
}

export async function saveLanguage(language) {
  try {
    await AsyncStorage.setItem("@language", language);
    console.log("language saved!");
  } catch (error) {
    console.error("Error saving theme", error);
  }
}
