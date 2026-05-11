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
serving Baguio City and the Cordillera Administrative Region (CAR). It connects adopters and rehomers
to rescue coordinators — Pawster is not a shelter and does not house animals.

Key platform facts:
- Adopters must complete a pre-adoption questionnaire (living situation, pet experience, time availability, finances) before submitting a request.
- Adopters must upload a valid government-issued ID for verification.
- Post-adoption check-ins are scheduled at Day 7, Day 30, and Day 90 after adoption.
- Each check-in opens a private messaging channel between the adopter and their rescue coordinator.
- Rehoming requests are submitted through the platform and reviewed by a rescue coordinator.
- The platform serves Baguio City and CAR (Cordillera Administrative Region).

The user selected a support topic. Give a helpful, friendly, and specific response (2-4 sentences).
Address the topic directly using the platform facts above where relevant.
End by letting them know a human coordinator or support agent will follow up shortly.
Be warm and concise. Do not ask follow-up questions.`;

const FALLBACK_REPLIES = {
  "Pet adoption inquiry":
    "Thanks for your interest in adopting through Pawster! To get started, you'll need to register, upload a valid government-issued ID, and complete the pre-adoption questionnaire. Once that's done, you can browse available animals and submit a formal adoption request. A member of our support team will follow up with you shortly!",

  "Adoption application status":
    "We understand the wait can be exciting! Application review times vary by rescue coordinator, but most requests receive a response within a few business days. You can track your application status directly in your Pawster profile. A support agent will follow up to help you further shortly.",

  "Post-adoption check-in concern":
    "Congrats on your adoption! Post-adoption check-ins are scheduled at Day 7, Day 30, and Day 90 — each one opens a private messaging channel between you and your rescue coordinator. If you're having trouble submitting a check-in or reaching your coordinator, our team will look into it right away. A support agent will follow up with you shortly.",

  "Rehoming or rescue request":
    "We're here to help you through this. You can submit a rehoming or rescue request directly through the platform, and a rescue coordinator will review it and coordinate next steps with you. Please make sure your account is verified so the process goes smoothly. A support team member will follow up with you shortly.",

  "Account or technical problem":
    "Sorry for the trouble! Whether it's a login issue, a problem with your ID upload, or something else on the platform, our technical team will investigate and get things sorted for you. A support agent will follow up as soon as possible.",

  "General inquiry":
    "Thanks for reaching out to Pawster! We're a digital adoption platform serving Baguio City and the Cordillera Administrative Region, connecting adopters with rescue coordinators. Whatever your question, our support team will get back to you with a detailed response very soon.",
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
        const response = await fetch(`${OLLAMA_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: OLLAMA_MODEL,
            stream: false,
            messages: [
              { role: "system", content: BOT_REPLY_SYSTEM_PROMPT },
              { role: "user",   content: `The user's selected topic is: "${replyTopic}". Provide a helpful temporary answer about this topic.` },
            ],
          }),
        });
        if (!response.ok) throw new Error(`Ollama ${response.status}`);
        const data = await response.json();
        replyText = data.message?.content?.trim() ?? "";
      } catch {
        // Ollama unavailable — use topic-specific fallback
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