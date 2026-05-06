import { useRef, useCallback } from "react";
import api from "../config/axios";

const OLLAMA_URL   = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = "llama3.2";

export const GREETING = "Hi there! Welcome to Pawster Support! Please select what you need help with:";

export const FAQ_OPTIONS = [
  { label: "Pet adoption inquiry",         value: "Pet adoption inquiry" },
  { label: "Payment or billing issue",     value: "Payment or billing issue" },
  { label: "Order or delivery concern",    value: "Order or delivery concern" },
  { label: "Pet health question",          value: "Pet health question" },
  { label: "Account or technical problem", value: "Account or technical problem" },
  { label: "General inquiry",              value: "General inquiry" },
];

const BOT_REPLY_SYSTEM_PROMPT = `You are a Pawster Support bot for a pet store app.
The user selected a support topic. Give a helpful, friendly temporary answer (2-4 sentences).
Address the specific topic they chose with relevant info or next steps.
End by letting them know a human agent will follow up shortly.
Be warm and concise. Do not ask follow-up questions.`;

const FALLBACK_REPLIES = {
  "Pet adoption inquiry":         "Thanks for your interest in adopting! Our adoption team reviews applications daily and will reach out within 24 hours to guide you through the process.",
  "Payment or billing issue":     "We're sorry to hear about the billing concern! Our finance team will review your account and resolve any discrepancies promptly.",
  "Order or delivery concern":    "We'll look into your order right away! Most delivery issues are resolved within 1-2 business days. You'll get a tracking update soon.",
  "Pet health question":          "Your pet's health is our priority! While we connect you with our vet partners, please monitor your pet closely. A specialist will follow up shortly.",
  "Account or technical problem": "Sorry for the inconvenience! Our tech team has been alerted and will investigate your account issue as soon as possible.",
  "General inquiry":              "Thanks for reaching out to Pawster! Our support team will get back to you with a detailed response very soon.",
};

export function useBotReply({ sendMessage, messages, onBotTypingChange, sessionKey, setMessages }) {
  const greetedRef  = useRef(false);
  const botBusyRef  = useRef(false);
  const ackedRef    = useRef(false);

  const adminHasReplied = useCallback((msgs) => {
    return msgs.some(m => m.senderRole === "admin" && !m.isBot);
  }, []);

  // only calls the API to persist — does NOT inject into local state
  // local state is handled by the websocket echo from the server
  const sendBotMessage = useCallback(async (content) => {
    try {
      await api.post("/api/messages/bot-reply", { content });
    } catch (err) {
      console.error("[bot] failed to persist", err);
      // if API fails, inject locally as fallback so user sees something
      setMessages(prev => [...prev, {
        id:         `bot-local-${Date.now()}`,
        content,
        senderRole: "admin",
        isBot:      true,
        createdAt:  new Date().toISOString(),
        read:       false,
      }]);
    }
  }, [setMessages]);

  const triggerBotGreeting = useCallback(async (existingMessages) => {
    if (greetedRef.current) return;
    greetedRef.current = true;

    // history already has messages — greeting was already sent before
    if (existingMessages && existingMessages.length > 0) {
      const hasAck = existingMessages.some(m => m.isBot && m.content !== GREETING);
      if (hasAck) ackedRef.current = true;
      return;
    }

    // fresh chat — send greeting
    onBotTypingChange?.(true);
    await new Promise(r => setTimeout(r, 900));
    onBotTypingChange?.(false);
    await sendBotMessage(GREETING);
  }, [sendBotMessage, onBotTypingChange]);

  const triggerBotReply = useCallback(async (currentMessages, { force = false } = {}) => {
  if (force) {
    botBusyRef.current = false;
    ackedRef.current   = false;
  }
  if (botBusyRef.current) return;
  if (!force && ackedRef.current) return;
  if (adminHasReplied(currentMessages)) return;

  const last = currentMessages[currentMessages.length - 1];
  if (!last || last.senderRole !== "user") return;
  if (!last.content?.trim()) return;

  botBusyRef.current = true;
  ackedRef.current   = true;
    onBotTypingChange?.(true);

    try {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 500));

      let replyText = "";

      try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: false,
            messages: [
              { role: "system", content: BOT_REPLY_SYSTEM_PROMPT },
              { role: "user",   content: `The user's selected topic is: "${last.content}". Provide a helpful temporary answer about this topic.` },
            ],
          }),
        });
        if (!response.ok) throw new Error(`Ollama ${response.status}`);
        const data = await response.json();
        replyText = data.message?.content?.trim() ?? "";
      } catch {
        // Ollama unavailable — use topic-specific fallback
        replyText = FALLBACK_REPLIES[last.content]
          ?? "Thank you for reaching out! Our support team has been notified and will get back to you shortly.";
      }

      if (replyText) {
  // persist to server — websocket echo will display it
  api.post("/api/messages/bot-reply", { content: replyText }).catch(err => {
    console.error("[bot] failed to persist reply", err);
    // only inject locally if server call fails, as fallback
    setMessages(prev => [...prev, {
      id:         `bot-local-${Date.now()}`,
      content:    replyText,
      senderRole: "admin",
      isBot:      true,
      createdAt:  new Date().toISOString(),
      read:       false,
    }]);
  });
}
    } finally {
      botBusyRef.current = false;
      onBotTypingChange?.(false);
    }
  }, [adminHasReplied, onBotTypingChange, setMessages]);

  return { triggerBotGreeting, triggerBotReply };
}