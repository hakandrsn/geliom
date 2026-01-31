import { useAppStore } from "@/store/useAppStore";
import { Platform } from "react-native";
import { io, Socket } from "socket.io-client";
import { StatusUpdatePayload } from "./types";

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (socket) return; // Prevent multiple connections

  // Use the same host as the API
  const SOCKET_URL =
    Platform.OS === "android"
      ? "http://10.0.2.2:3000"
      : "http://localhost:3000";

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    // Prioritize polling for emulators, fallback to websocket
    transports: ["polling", "websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
    if (reason === "io server disconnect") {
      // the disconnection was initiated by the server, you need to reconnect manually
      socket?.connect();
    }
  });

  // Listen for Status Updates
  socket.on("statusUpdate", (data: StatusUpdatePayload) => {
    console.log("New status update received:", data);
    const { userId, groupId, text, emoji, mood, updatedAt } = data;

    // Update Store
    // We update the group status in the store regardless of which group is currently selected,
    // so that when the user switches to that group, the data is already there.
    // Zustand store will handle immutability updates.
    useAppStore.getState().updateGroupStatus(groupId, {
      userId,
      groupId,
      text,
      emoji: emoji || null,
      mood: mood || null,
      updatedAt,
    });

    // If mood is present, also update mood
    if (mood) {
      useAppStore.getState().updateGroupMood(groupId, {
        userId,
        groupId,
        text, // Mood update usually comes with status text, or we reuse it
        emoji: emoji || null,
        mood: mood,
        updatedAt,
      });
    }
  });

  // Listen for Group Data Updates
  socket.on("groupUpdate", (data: any) => {
    console.log("Group update received:", data);
  });

  // Listen for Member Updates
  socket.on("memberUpdate", (data: { groupId: string; members: any[] }) => {
    console.log("Member update received for group:", data.groupId);
    useAppStore.getState().updateGroupMembers(data.groupId, data.members);
  });
};

export const joinGroupRoom = (groupId: string) => {
  if (socket && socket.connected) {
    console.log("🚪 Joining room:", groupId);
    socket.emit("joinRoom", groupId);
  } else if (socket) {
    // If not connected yet, wait for connect and then join
    socket.once("connect", () => {
      console.log("🚪 Joining room (after connect):", groupId);
      socket?.emit("joinRoom", groupId);
    });
  }
};

export const leaveGroupRoom = (groupId: string) => {
  if (socket && socket.connected) {
    console.log("🚪 Leaving room:", groupId);
    socket.emit("leaveRoom", groupId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
