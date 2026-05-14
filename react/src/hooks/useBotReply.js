import { useRef, useCallback } from "react";
import api from "../config/axios";

const OLLAMA_URL   = import.meta.env.VITE_OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = "llama3.2";

export const GREETING = "Hi there! Welcome to Pawster Support! Please select what you need help with:";

export const FAQ_OPTIONS = [
  { label: "Pet adoption inquiry",              value: "Pet adoption inquiry" },
  { label: "Adoption application status",       value: "Adoption application status" },
  { label: "Post-adoption check-in concern",    value: "Post-adoption check-in concern" },
  { label: "Rehoming or rescue request",        value: "Rehoming or rescue request" },
  { label: "Account or technical problem",      value: "Account or technical problem" },
  { label: "General inquiry",                   value: "General inquiry" },
];

const BOT_REPLY_SYSTEM_PROMPT = `You are a Pawster Support bot. Pawster is a digital pet adoption platform
serving Baguio City and the Cordillera Administrative Region (CAR).

Key facts:
- Adopters need a pre-adoption questionnaire + government-issued ID.
- Post-adoption check-ins: Day 7, Day 30, Day 90.
- Each check-in opens a private channel with the rescue coordinator.
- Rehoming requests are reviewed by a rescue coordinator.

Reply in 1-2 short sentences max. Be warm and direct. End with: "A coordinator will follow up shortly."`;

const FALLBACK_REPLIES = {
  "Pet adoption inquiry":
    "To adopt, register, upload a valid ID, and complete the pre-adoption questionnaire. A coordinator will follow up shortly!",

  "Adoption application status":
    "Most requests are reviewed within a few business days — check your profile for updates. A coordinator will follow up shortly!",

  "Post-adoption check-in concern":
    "Check-ins are scheduled at Day 7, Day 30, and Day 90 via a private channel with your coordinator. A coordinator will follow up shortly!",

  "Rehoming or rescue request":
    "Submit a rehoming request through the platform and a rescue coordinator will review it. A coordinator will follow up shortly!",

  "Account or technical problem":
    "Sorry for the trouble! Our team will investigate and get things sorted. A coordinator will follow up shortly!",

  "General inquiry":
    "We serve Baguio City and CAR, connecting adopters with rescue coordinators. A coordinator will follow up shortly!",
};

export function useBotReply({ sendMessage, messages, onBotTypingChange, sessionKey, setMessages }) {
  const greetedRef  = useRef(false);
  const botBusyRef  = useRef(false);
  const ackedRef    = useRef(false);

  // Checks if a real human admin (not bot) has already replied
  const adminHasReplied = useCallback((msgs) => {
    return msgs.some(m => m.senderRole === "admin" && !m.isBot && !m.bot);
  }, []);

  // Persists bot message via API; falls back to local inject if API fails
  const sendBotMessage = useCallback(async (content) => {
    try {
      await api.post("/api/messages/bot-reply", { content });
    } catch (err) {
      console.error("[bot] failed to persist", err);
      setMessages?.(prev => [...prev, {
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

    // Already has messages — greeting was already sent before, mark acked if
    // a non-greeting bot message exists (meaning FAQ was already handled)
    if (existingMessages && existingMessages.length > 0) {
      const hasNonGreetingBotMsg = existingMessages.some(
        m => (m.isBot || m.bot) && m.content !== GREETING
      );
      if (hasNonGreetingBotMsg) ackedRef.current = true;
      return;
    }

    // Fresh chat — send greeting
    onBotTypingChange?.(true);
    await new Promise(r => setTimeout(r, 900));
    onBotTypingChange?.(false);
    await sendBotMessage(GREETING);
  }, [sendBotMessage, onBotTypingChange]);

  /**
   * Triggers a bot reply to the last user message.
   *
   * @param {Array}   currentMessages - The full messages array at time of call
   * @param {Object}  opts
   * @param {boolean} opts.force      - Bypass the ackedRef guard (used by FAQ selection)
   * @param {string}  opts.topic      - When provided, reply to this topic directly
   *                                    without scanning currentMessages for last user msg
   */
  const triggerBotReply = useCallback(async (currentMessages, { force = false, topic = null } = {}) => {
    // force=true resets all guards so a fresh reply is always generated
    if (force) {
      botBusyRef.current = false;
      ackedRef.current   = false;
    }

    if (botBusyRef.current) return;
    if (!force && ackedRef.current) return;

    // Don't reply if a human admin already has
    if (adminHasReplied(currentMessages)) return;

    // Determine what the user said
    let replyTopic = topic;
    if (!replyTopic) {
      const last = currentMessages[currentMessages.length - 1];
      if (!last || last.senderRole !== "user") return;
      if (!last.content?.trim()) return;
      replyTopic = last.content.trim();
    }

    botBusyRef.current = true;
    ackedRef.current   = true;
    onBotTypingChange?.(true);

    try {
      await new Promise(r => setTimeout(r, 800 + Math.random() * 500));

      let replyText = "";

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000); // 2s max
        try {
          const response = await fetch(`${OLLAMA_URL}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              model: OLLAMA_MODEL,
              stream: false,
              messages: [
                { role: "system", content: BOT_REPLY_SYSTEM_PROMPT },
                { role: "user", content: `Topic: "${replyTopic}". Reply in 1-2 sentences only.` },
              ],
            }),
          });
          clearTimeout(timeout);
          if (!response.ok) throw new Error(`Ollama ${response.status}`);
          const data = await response.json();
          replyText = data.message?.content?.trim() ?? "";
        } finally {
          clearTimeout(timeout);
        }
      } catch {
        // Ollama unavailable or timed out — use fallback instantly
        replyText = FALLBACK_REPLIES[replyTopic]
          ?? "Thank you for reaching out to Pawster! Our support team has been notified and will get back to you shortly.";
      }

      if (replyText) {
        await sendBotMessage(replyText);
      }
    } finally {
      botBusyRef.current = false;
      onBotTypingChange?.(false);
    }
  }, [adminHasReplied, onBotTypingChange, sendBotMessage]);

  return { triggerBotGreeting, triggerBotReply };
}