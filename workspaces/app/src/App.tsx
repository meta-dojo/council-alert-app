import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import React, { useEffect, useContext, useRef } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Header, Text, Image, Icon } from "react-native-elements";
import StateContext from "./Context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Random from "expo-random";
import * as Crypto from "expo-crypto";
import { Subscription } from "@unimodules/core";
import { NotificationList } from "./View";
import { $post } from "../src/Util/Request";

const kusamaLogo = require("../assets/KUSAMA_1.png");

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const state = useContext(StateContext);

  const notificationListener = useRef<Subscription | null>(null);
  const responseListener = useRef<Subscription | null>(null);

  // This will be replaced by https://kusama.polkassembly.io/bounty/3
  const getId = async (): Promise<string> => {
    let id = await AsyncStorage.getItem("id");

    if (!id) {
      const seed = await Random.getRandomBytesAsync(256);

      id = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        seed.toString()
      );

      await AsyncStorage.setItem("id", id);
    }

    return id;
  };

  const getNotificationToken = async () => {
    // TESTING DATA
    // return `ExponentPushToken[oZI8lHf70IEgG-u1T31]`;
    if (!Constants.isDevice) {
      alert("Must use physical device for Push Notifications");
      return;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Please enable notification for better experience");
      return;
    }

    const notificationToken = (await Notifications.getExpoPushTokenAsync())
      .data;

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return notificationToken;
  };

  const getMetaData = async () => {
    const response = await $post(`/meta-data`);

    if (response) {
      const { data: infos } = response;

      return infos;
    }

    return null;
  };

  useEffect(() => {
    (async () => {
      const id = await getId();

      let token = await getNotificationToken();

      const infos = await getMetaData();

      if (!token) {
        token = `NA`;
      }

      // This listener is fired whenever a notification is received while the app is foregrounded
      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) => {
          // state.getNotification(state.id);
        });

      // This listener is fired whenever a user taps on or interacts with a notification (works when app is foregrounded, backgrounded, or killed)
      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          // Doesn't do much now
          console.log(`Tag!`);

          console.log(response);
        });

      state.setState({
        id,
        notificationToken: token,
        loadingMetaData: false,
        availableChains: infos,
        currentChain: infos[0],
      });
    })();

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }

      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  if (state.loadingMetaData) {
    return (
      <View style={page.container}>
        <View>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  // TODO 1: Display avaialble chain options(probably include 'ALL' option)
  // TODO 2: Apply additional filter here e.g importance
  const renderFilterComponent = () => {
    const { displayName } = state.currentChain || {};

    return (
      <Image source={kusamaLogo} style={{ width: 200, height: 50 }}></Image>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Header
        backgroundColor={`black`}
        centerComponent={renderFilterComponent()}
        // rightComponent={{
        //   icon: "refresh",
        //   color: "#fff",
        //   onPress: () => {
        //     state.getNotification(state.id);
        //   },
        // }}
        rightComponent={
          <View
            style={{
              display: `flex`,
              flex: 1,
              justifyContent: `center`,
              paddingRight: 5,
            }}
          >
            <Icon
              name="refresh"
              color="#fff"
              size={30}
              onPress={() => {
                state.getNotification(state.id);
              }}
            ></Icon>
          </View>
        }
      />
      <NotificationList></NotificationList>
    </View>
  );
}

const page = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around",
    padding: 24,
  },
});
