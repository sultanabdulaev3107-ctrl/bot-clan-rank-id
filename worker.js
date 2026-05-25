const BOT_TOKEN = "8633981336:AAFPhNi9RtHzh1iDS7LmGgXqcns8Rx45gJQ";
const OWNER_ID = "8732464021";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId, text) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}

// ===== KV =====

async function getHistory(env, userId) {
  const data = await env.xarizma_chat.get(userId);
  return data ? JSON.parse(data) : [];
}

async function saveHistory(env, userId, history) {
  await env.xarizma_chat.put(
    userId,
    JSON.stringify(history.slice(-30))
  );
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("ok");

    const update = await request.json();
    if (!update.message) return new Response("ok");

    const msg = update.message;

    const chatId = String(msg.chat.id);
    const text = msg.text || "";

    // ================= OWNER =================
    if (chatId === OWNER_ID) {
      const space = text.indexOf(" ");

      if (space !== -1) {
        const targetId = text.slice(0, space);
        const messageText = text.slice(space + 1);

        if (/^\d+$/.test(targetId)) {
          const history = await getHistory(env, targetId);

          history.push(`Ты: ${messageText}`);
          await saveHistory(env, targetId, history);

          await sendMessage(targetId, messageText);

          await sendMessage(OWNER_ID, `✔ ${targetId}`);
        }
      }

      return new Response("ok");
    }

    // ================= USER =================
    const name = msg.from.first_name || "друг";
    const username = msg.from.username ? `@${msg.from.username}` : "no_username";

    if (text === "/start") {
      await sendMessage(
        chatId,
`Привет, ${name} 👋

Оставьте сообщение и с вами свяжутся в течение дня.`
      );
      return new Response("ok");
    }

    const history = await getHistory(env, chatId);
    history.push(`Пользователь: ${text}`);
    await saveHistory(env, chatId, history);

    const historyText = history.join("\n");

    // ================= OWNER OUTPUT =================

    // 1) отдельное сообщение только ID (копируемое)
    await sendMessage(OWNER_ID, `${chatId}`);

    // 2) основное сообщение (как ты просил — БЕЗ "новое сообщение")
    await sendMessage(
      OWNER_ID,
`${name} ${username}
ID: ${chatId}

${text}

────────────
История:
${historyText}`
    );

    return new Response("ok");
  }
};
