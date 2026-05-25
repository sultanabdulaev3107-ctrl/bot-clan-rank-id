const BOT_TOKEN = "8633981336:AAFPhNi9RtHzh1iDS7LmGgXqcns8Rx45gJQ";
const OWNER_ID = "8732464021";

const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const chats = new Map();

async function sendMessage(chatId, text) {
  await fetch(`${API}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text
    })
  });
}

export default {
  async fetch(request) {

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

    // ===== OWNER =====

    if (chatId === OWNER_ID) {

      // Формат:
      // 123456789 привет

      const firstSpace = text.indexOf(" ");

      if (firstSpace !== -1) {

        const targetId = text.slice(0, firstSpace);
        const messageText = text.slice(firstSpace + 1);

        if (/^\d+$/.test(targetId)) {

          // сохраняем историю
          if (!chats.has(targetId)) {
            chats.set(targetId, []);
          }

          chats.get(targetId).push(`Ты: ${messageText}`);

          await sendMessage(
            targetId,
            messageText
          );

          await sendMessage(
            OWNER_ID,
            `✅ Отправлено пользователю ${targetId}`
          );
        }
      }

      return new Response("ok");
    }

    // ===== USER =====

    const username = msg.from.username
      ? `@${msg.from.username}`
      : "без username";

    const firstName = msg.from.first_name || "друг";

    // /start
    if (text === "/start") {

      await sendMessage(
        chatId,
        `Привет, ${firstName} 👋

Оставьте своё сообщение и с вами свяжутся в течение дня.`
      );

      return new Response("ok");
    }

    // создаём историю
    if (!chats.has(chatId)) {
      chats.set(chatId, []);
    }

    // добавляем сообщение
    chats.get(chatId).push(`Пользователь: ${text}`);

    // ограничиваем историю
    if (chats.get(chatId).length > 20) {
      chats.get(chatId).shift();
    }

    const history = chats.get(chatId).join("\n");

    // пересылаем владельцу
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

${history}`
    );

    return new Response("ok");
  }
}
