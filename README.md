<div align="center">
  <img src="https://stito.eu.org/assets/img/NexoLogoWhite.png" alt="Nexo Logo" width="200px" />
  <h1>NexoApp</h1>
  
  <p>
    <strong>The official companion mobile app to control and customize <a href="https://github.com/st7712/nexo">Nexo smart speakers</a>.</strong>
  </p>

  <p>
    <a href="#about">About</a> •
    <a href="#features">Features</a> •
    <a href="#installation">Installation</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="https://discord.com/users/stitoo">Support</a>
  </p>

  ![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
  ![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)
  ![License](https://img.shields.io/badge/license-MIT-green.svg)
</div>

---

## About
**NexoApp** is the mobile control center for the [Nexo Smart Speaker](https://github.com/st7712/nexo). Built with React Native and Expo, it allows users to control audio playback, manage multi-room groups, and change EQ settings all from a clean, modern interface.

The app communicates with the Nexo Speaker's FastAPI backend using **AJAX**, ensuring that the app UI and the speaker's physical hardware buttons are always perfectly in sync in real-time.

## Features

- **Real-Time Syncing**: Instantly updates volume, playback status, and track metadata.
- **Music Player**: Features a persistent mini-player at the top of the screen with a progress bar, timestamps, and skip controls.
- **Multi-Room & Groups**: Manage multiple Nexo speakers and assign them to specific groups (e.g., Living Room, Kitchen).
- **Customizable UI**: Supports dynamic Light and Dark themes, as well as multi-language localization (English / Czech).
- **Smooth Animations**: Utilizes React Native's Animated API and PanResponder for fluid, native-feeling gestures and bottom sheets.

## Installation & Setup

The easiest way to install and run the app is by installing a prebuilt APK file downloadable [here](https://github.com/st7712/nexoApp/releases/latest).

**However,**

if you want to run the app locally for development or testing, follow these steps:

**Prerequisites:**
* [Node.js](https://nodejs.org/) installed on your computer.
* [Expo Go](https://expo.dev/client) app installed on your iOS or Android device.

**1. Clone the repository:**
```bash
git clone https://github.com/st7712/nexoApp.git
cd nexoApp
```

**2. Install dependencies:**

```bash
npm install
```

**3. Start the development server:**

```bash
npx expo start
```

*Once the server starts, open the **Expo Go** app on your phone and scan the QR code displayed in your terminal to launch the app.*

## Building for Production

This project is configured to use **EAS (Expo Application Services)** for building standalone `.apk` (Android) or `.ipa` (iOS) files.

```bash
# Install the EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production
```

## Configuration

By default, the app looks for the Nexo Speaker's local IP address on your network.

* **Speaker IP:** Ensure your phone is connected to the same Wi-Fi network as the Nexo Speaker.

## Tech Stack

* **Framework:** [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
* **Navigation:** React Navigation
* **State & Data:** REST API (Local Nexo API)
* **UI Components:** `react-native-svg`, `@miblanchard/react-native-slider`, `react-native-progress`

## Contributing

Contributions are welcome! If you want to add more functions or improve the UI:

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/NewFeature`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

## Related Projects

* **[Nexo Smart Speaker (Hardware/Backend)](https://github.com/st7712/nexo)** - The Python backend and hardware guide that this app controls.

## Feedback

Created by **@stitoo**. Reach out on Discord or open a GitHub Issue!
