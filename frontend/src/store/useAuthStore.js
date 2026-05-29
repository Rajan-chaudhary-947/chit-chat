import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  pendingVerificationEmail: sessionStorage.getItem("pendingVerificationEmail") || null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  isGettingUserProfile: false,
  fetchedUserProfile: null,
  notifications: [],
  unreadNotifications: 0,
  isVerifyingEmail: false,
  isResendingOtp: false,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().getNotifications();
      get().connectSocket();
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      sessionStorage.setItem("pendingVerificationEmail", res.data.email);
      set({ authUser: null, pendingVerificationEmail: res.data.email });
      toast.success("Account created, Check your email for verification OTP");
      return "verification";
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create account");
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  verifyEmail: async (otp) => {
    set({ isVerifyingEmail: true });
    try {
      const email = get().pendingVerificationEmail;
      const res = await axiosInstance.post("/auth/verify-email", { email, otp });
      sessionStorage.removeItem("pendingVerificationEmail");
      set({ authUser: res.data.user, pendingVerificationEmail: null });
      toast.success(res.data.message || "Email verified successfully");
      get().getNotifications();
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to verify email");
      return false;
    } finally {
      set({ isVerifyingEmail: false });
    }
  },

  resendVerificationOtp: async () => {
    set({ isResendingOtp: true });
    try {
      const email = get().pendingVerificationEmail;
      const res = await axiosInstance.post("/auth/resend-verification-otp", { email });
      toast.success(res.data.message || "OTP sent successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      set({ isResendingOtp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);

      if (res.data.requiresVerification) {
        sessionStorage.setItem("pendingVerificationEmail", res.data.email);
        set({ authUser: null, pendingVerificationEmail: res.data.email });
        toast.success(res.data.message || "Check your email for verification OTP");
        return "verification";
      }

      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().getNotifications();
      get().connectSocket();
      return "authenticated";
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to log in");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      sessionStorage.removeItem("pendingVerificationEmail");
      set({ authUser: null, pendingVerificationEmail: null, notifications: [], unreadNotifications: 0 });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  getUserProfile: async (userId) => {
    set({ isGettingUserProfile: true });
    try {
      const res = await axiosInstance.get(`/users/${userId}`);
      set({ fetchedUserProfile: res.data });
      return res.data;
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isGettingUserProfile: false });
    }
  },

  getNotifications: async () => {
    try {
      const res = await axiosInstance.get("/notifications");
      set({
        notifications: res.data,
        unreadNotifications: res.data.filter((notification) => !notification.read).length,
      });
    } catch {
      set({ notifications: [], unreadNotifications: 0 });
    }
  },

  markNotificationsAsRead: async () => {
    const unreadNotifications = get().notifications.filter(
      (notification) => !notification.read
    );

    if (unreadNotifications.length === 0) return;

    set({
      notifications: get().notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
      unreadNotifications: 0,
    });

    try {
      await axiosInstance.patch("/notifications/read");
    } catch (error) {
      set({
        notifications: get().notifications.map((notification) =>
          unreadNotifications.some((unread) => unread._id === notification._id)
            ? { ...notification, read: false }
            : notification
        ),
        unreadNotifications: unreadNotifications.length,
      });
      toast.error(error.response?.data?.message || "Failed to mark notifications as read");
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });


    socket.on("new_notification", (notification) => {
      set({
        notifications: [notification, ...get().notifications],
        unreadNotifications: get().unreadNotifications + 1,
      });

      toast.success("New notification");
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
