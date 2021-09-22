import React, { useState, useEffect, useContext } from "react";
import { View, StyleSheet } from "react-native";
import { Button, Overlay, Text } from "react-native-elements";
import StateContext from "../Context";
import { $post } from "../Util/Request";
import { NotificationDTO } from "../../../server/src/util/DBOperator";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

export default function DetailModal({
  visible,
  notification: n,
  hideModal,
}: {
  visible: boolean;
  notification?: NotificationDTO;
  hideModal: () => void;
}) {
  return (
    <View>
      <Overlay isVisible={visible} onBackdropPress={hideModal}>
        <Text>{n?._id}</Text>
      </Overlay>
    </View>
  );
}