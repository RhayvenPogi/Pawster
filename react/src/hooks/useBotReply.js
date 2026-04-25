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

const ACK_SYSTEM_PROMPT = `You are a Pawster Support bot.
The user selected a support topic. Write ONE short warm acknowledgment (1-2 sentences max).
Tell them their concern has been noted and a human support agent will follow up shortly.
Do not try to resolve the issue. Do not ask questions.`;

const ackedSessions = new Set();

export function useBotReply({ sendMessage, messages, onBotTypingChange, sessionKey }) {
  const greetedRef = useRef(false);
  const botBusyRef = useRef(false);

  const adminHasReplied = useCallback((msgs) => {
    return msgs.some(m => m.senderRole === "admin" && !m.isBot);
  }, []);

  const sendBotMessage = useCallback(async (content) => {
    try {
      await api.post("/api/messages/bot-reply", { content });
    } catch (err) {
      console.error("[bot] failed to send", err);
    }
  }, []);

  const triggerBotGreeting = useCallback(async (existingMessages) => {
    if (greetedRef.current) return;

    if (existingMessages && existingMessages.length > 0) {
      greetedRef.current = true;
      const hasAck = existingMessages.some(m => m.isBot && m.content !== GREETING);
      if (hasAck && sessionKey) ackedSessions.add(sessionKey);
      return;
    }

    greetedRef.current = true;
    onBotTypingChange?.(true);
    await new Promise(r => setTimeout(r, 900));
    onBotTypingChange?.(false);
    await sendBotMessage(GREETING);
  }, [sendBotMessage, onBotTypingChange, sessionKey]);

  const triggerBotReply = useCallback(async (currentMessages) => {
    if (botBusyRef.current) return;
    if (sessionKey && ackedSessions.has(sessionKey)) return;
    if (adminHasReplied(currentMessages)) return;

    const last = currentMessages[currentMessages.length - 1];
    if (!last || last.senderRole !== "user") return;
    if (!last.content?.trim()) return;

    botBusyRef.current = true;
    if (sessionKey) ackedSessions.add(sessionKey);
    onBotTypingChange?.(true);

    try {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 500));

      let ackMessage = "";
      try {
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: false,
            messages: [
              { role: "system", content: ACK_SYSTEM_PROMPT },
              { role: "user",   content: last.content },
            ],
          }),
        });
        if (!response.ok) throw new Error(`Ollama ${response.status}`);
        const data = await response.json();
        ackMessage = data.message?.content?.trim() ?? "";
      } catch {
        ackMessage = "Thank you for reaching out! Our support team has been notified and will get back to you shortly.";
      }

      if (ackMessage) await sendBotMessage(ackMessage);
    } finally {
      botBusyRef.current = false;
      onBotTypingChange?.(false);
    }
  }, [adminHasReplied, sendBotMessage, onBotTypingChange, sessionKey]);

  return { triggerBotGreeting, triggerBotReply };
}