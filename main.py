import asyncio
from aiogram import Bot, Dispatcher, types, F

# Ваша переменная с токеном
TOKEN = "8633981336:AAGD7Jr8PzC2hv_qNDGftGE9M6WGdt4q3Cs"

# Инициализация бота и диспетчера
bot = Bot(token=TOKEN)
dp = Dispatcher()

# Обработчик любого текстового сообщения
@dp.message()
async def echo_handler(message: types.Message):
    await message.answer("Привет!")

# Запуск процесса опроса (polling)
async def main():
    print("Бот запущен...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
