const BOT_TOKEN = "8633981336:AAFPhNi9RtHzh1iDS7LmGgXqcns8Rx45gJQ";
const OWNER_ID = "8732464021";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendMessage(chatId, text) {

  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });
}

// =======================
// HISTORY
// =======================

async function getHistory(env, userId) {

  const data = await env.CHATS.get(userId);

  if (!data) {
    return [];
  }

  return JSON.parse(data);
}

async function saveHistory(env, userId, history) {

  // ограничиваем историю
  const limited = history.slice(-30);

  await env.CHATS.put(
    userId,
    JSON.stringify(limited)
  );
}

export default {

  async fetch(request, env) {

    if (request.method !== "POST") {
      return new Response("Bot is running");
    }

    const update = await request.json();

    if (!update.message) {
      return new Response("ok");
    }

    const msg = update.message;

    const chatId = String(msg.chat.id);
    const text = msg.text || "";

    // =======================
    // OWNER
    // =======================

    if (chatId === OWNER_ID) {

      // Формат:
      // 123456789 привет

      const firstSpace = text.indexOf(" ");

      if (firstSpace !== -1) {

        const targetId = text.slice(0, firstSpace);
        const messageText = text.slice(firstSpace + 1);

        if (/^\d+$/.test(targetId)) {

          // история
          const history = await getHistory(
            env,
            targetId
          );

          history.push(`Ты: ${messageText}`);

          await saveHistory(
            env,
            targetId,
            history
          );

          // отправка пользователю
          await sendMessage(
            targetId,
            messageText
          );

          // подтверждение владельцу
          await sendMessage(
            OWNER_ID,
            `✅ Отправлено пользователю ${targetId}`
          );
        }
      }

      return new Response("ok");
    }

    // =======================
    // USER
    // =======================

    const firstName =
      msg.from.first_name || "друг";

    const username =
      msg.from.username
        ? `@${msg.from.username}`
        : "без username";

    // /start
    if (text === "/start") {

      await sendMessage(
        chatId,
`Привет, ${firstName} 👋

Оставьте своё сообщение и с вами свяжутся в течение дня.`
      );

      return new Response("ok");
    }

    // получаем историю
    const history = await getHistory(
      env,
      chatId
    );

    // сохраняем сообщение
    history.push(`Пользователь: ${text}`);

    await saveHistory(
      env,
      chatId,
      history
    );

    // история текстом
    const historyText =
      history.join("\n");

    // отправляем владельцу
    await sendMessage(
      OWNER_ID,
`📩 Новое сообщение

👤 ${firstName}
🔗 ${username}
🆔 ${chatId}

💬 Сообщение:
${text}

────────────

📜 История диалога:

${historyText}`
    );

    return new Response("ok");
  }
}
