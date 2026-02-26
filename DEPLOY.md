# Деплой на Vercel — если 404

1. **Root Directory**  
   Vercel → Project → **Settings** → **General** → **Root Directory** должен быть **пустым** (или `.`). Если указана папка (например `app` или `frontend`), сборка будет из неё и маршрут `/` не найдётся → 404.

2. **Build Command**  
   Должен выполняться `next build --webpack` (уже прописан в `package.json` и при необходимости в `vercel.json`).

3. **Проверка деплоя**  
   После деплоя открой:
   - **Production**: `https://<твой-проект>.vercel.app/`
   - Проверка: `https://<твой-проект>.vercel.app/api/health` — должен вернуть `{"ok":true}`.

4. **Логи сборки**  
   Vercel → **Deployments** → последний деплой → **Building**. В логе должно быть:
   - `✓ Compiled successfully`
   - В таблице маршрутов: `○ /` (главная).

Если всё так и `/` всё равно 404 — попробуй **Redeploy** (без кэша): Deployments → ⋮ у последнего деплоя → **Redeploy** → включи **Clear Build Cache**.
