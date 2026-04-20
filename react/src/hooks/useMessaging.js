import { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import api from "../config/axios";

const WS_URL = "/ws/chat";

// Case-insensitive admin check — handles "admin", "ADMIN", "Admin", etc.
const checkIsAdmin = (user) => user?.role?.toLowerCase() === "admin";

export function useMessaging(user, targetUserId = null) {
  const [messages,      setMessages]      = useState([]);
  const [connected,     setConnected]     = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [conversations, setConversations] = useState([]);

  const stompRef   = useRef(null);
  const targetRef  = useRef(targetUserId);
  const isAdminRef = useRef(checkIsAdmin(user));
  const userRef    = useRef(user);
  const mountedRef = useRef(true);

  const isAdmin = checkIsAdmin(user);

  // Sync refs inline on every render — no useEffect lag
  targetRef.current  = targetUserId;
  userRef.current    = user;
  isAdminRef.current = isAdmin;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── REST helpers ──────────────────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!userRef.current) return;
    try {
      const { data } = await api.get("/api/messages/unread-count");
      if (mountedRef.current) setUnreadCount(data.count ?? 0);
    } catch { /* ignore */ }
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!isAdminRef.current) return;
    try {
      const { data } = await api.get("/api/messages/conversations");
      if (mountedRef.current) setConversations(data);
    } catch (err) {
      console.error("[messaging] conversations error", err);
    }
  }, []);

  const markRead = useCallback(async (userId) => {
    try {
      const body = isAdminRef.current && userId ? { userId } : {};
      await api.post("/api/messages/read", body);
      fetchUnreadCount();
    } catch { /* ignore */ }
  }, [fetchUnreadCount]);

  const loadHistory = useCallback(async (userId) => {
    try {
      const params = isAdminRef.current && userId ? { userId } : {};
      const { data } = await api.get("/api/messages/history", { params });
      if (mountedRef.current) setMessages(data);
    } catch (err) {
      console.error("[messaging] history error", err);
    }
  }, []);

  const sendMessage = useCallback((content, targetUserIdOverride) => {
    if (!stompRef.current?.connected || !content.trim()) {
      console.warn("[STOMP] not connected or empty content");
      return;
    }
    if (isAdminRef.current) {
      const tid = targetUserIdOverride ?? targetRef.current;
      if (!tid) return;
      stompRef.current.publish({
        destination: "/app/chat.admin.send",
        body: JSON.stringify({ content, targetUserId: tid }),
      });
    } else {
      stompRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ content }),
      });
    }
  }, []);

  // ── WebSocket connect ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const token = localStorage.getItem("pawster_token");
    if (!token) return;

    if (stompRef.current) {
      stompRef.current.deactivate();
      stompRef.current = null;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,

      onConnect: () => {
        if (!mountedRef.current) return;
        setConnected(true);

        // These logs will appear in your browser console — check them
        // even from Docker by opening the app in a browser with DevTools
        console.log("[STOMP] connected");
        console.log("[STOMP] user.id:", userRef.current?.id);
        console.log("[STOMP] user.role (raw):", userRef.current?.role);
        console.log("[STOMP] isAdmin:", isAdminRef.current);

        if (isAdminRef.current) {
          console.log("[STOMP] admin subscribing to /topic/admin/inbox");
          client.subscribe("/topic/admin/inbox", (frame) => {
            if (!mountedRef.current) return;
            const msg = JSON.parse(frame.body);
            console.log("[STOMP] admin inbox received:", msg);

            // Always refresh sidebar
            fetchUnreadCount();
            fetchConversations();

            // msg.userId is always the non-admin participant on every message
            const activeId = targetRef.current;
            if (!activeId) return;
            if (String(msg.userId) !== String(activeId)) return;

            setMessages((prev) => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          });

        } else {
          const topic = `/topic/user/${userRef.current?.id}`;
          console.log("[STOMP] user subscribing to:", topic);

          client.subscribe(topic, (frame) => {
            if (!mountedRef.current) return;
            const msg = JSON.parse(frame.body);
            console.log("[STOMP] user received:", msg);
            setMessages((prev) => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            fetchUnreadCount();
          });
        }
      },

      onDisconnect: () => {
        if (!mountedRef.current) return;
        console.log("[STOMP] disconnected");
        setConnected(false);
      },

      onStompError: (frame) => {
        console.error("[STOMP error]", frame);
        if (mountedRef.current) setConnected(false);
      },
    });

    client.activate();
    stompRef.current = client;

    return () => {
      mountedRef.current = false;
      client.deactivate();
      stompRef.current = null;
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Bootstrap on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    fetchUnreadCount();
    if (isAdmin) fetchConversations();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    messages,
    setMessages,
    connected,
    unreadCount,
    conversations,
    loadHistory,
    sendMessage,
    markRead,
    fetchUnreadCount,
    fetchConversations,
  };
}