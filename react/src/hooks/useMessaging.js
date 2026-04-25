import { useState, useEffect, useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import api from "../config/axios";

const WS_URL = "/ws/chat";

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

  targetRef.current  = targetUserId;
  userRef.current    = user;
  isAdminRef.current = isAdmin;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
      return data;
    } catch (err) {
      console.error("[messaging] history error", err);
      return [];
    }
  }, []);

  const uploadFile = useCallback(async (file, targetUserIdOverride) => {
    const formData = new FormData();
    formData.append("file", file);
    if (isAdminRef.current) {
      const tid = targetUserIdOverride ?? targetRef.current;
      if (tid) formData.append("targetUserId", tid);
    }
    const { data } = await api.post("/api/messages/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }, []);

  const sendMessage = useCallback((content, targetUserIdOverride, attachment = null, isBot = false) => {
    if (!stompRef.current?.connected) {
      console.warn("[STOMP] not connected");
      return;
    }
    if (!content?.trim() && !attachment) return;

    const payload = {
      content:        content ?? "",
      attachmentUrl:  attachment?.url  ?? null,
      attachmentType: attachment?.type ?? null,
      isBot,
    };

    // Bot messages always go through the admin destination so the backend
    // saves them with senderRole="admin" and isBot=true
    if (isAdminRef.current || isBot) {
      const tid = targetUserIdOverride ?? targetRef.current ?? userRef.current?.id;
      if (!tid) return;
      stompRef.current.publish({
        destination: "/app/chat.admin.send",
        body: JSON.stringify({ ...payload, targetUserId: tid }),
      });
    } else {
      stompRef.current.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(payload),
      });
    }
  }, []);

  const mergeMessage = (prev, msg) => {
    if (prev.some(m => m.id === msg.id)) return prev;
    const index = prev.findIndex(m =>
      m.id?.toString().startsWith("pending") &&
      m.content === msg.content &&
      m.senderRole === msg.senderRole &&
      m.attachmentUrl === msg.attachmentUrl
    );
    if (index !== -1) {
      const updated = [...prev];
      updated[index] = msg;
      return updated;
    }
    return [...prev, msg];
  };

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

        if (isAdminRef.current) {
          client.subscribe("/topic/admin/inbox", (frame) => {
            if (!mountedRef.current) return;
            const msg = JSON.parse(frame.body);
            fetchUnreadCount();
            fetchConversations();
            const activeId = targetRef.current;
            if (!activeId) return;
            if (String(msg.userId) !== String(activeId)) return;
            setMessages(prev => mergeMessage(prev, msg));
          });
        } else {
          const topic = `/topic/user/${userRef.current?.id}`;
          client.subscribe(topic, (frame) => {
            if (!mountedRef.current) return;
            const msg = JSON.parse(frame.body);
            setMessages(prev => mergeMessage(prev, msg));
            fetchUnreadCount();
          });
        }
      },

      onDisconnect: () => {
        if (!mountedRef.current) return;
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
    uploadFile,
    markRead,
    fetchUnreadCount,
    fetchConversations,
  };
}