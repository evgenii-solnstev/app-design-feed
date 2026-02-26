# Деплой на Vercel — если 404

## Главное: выставить Production

Если **сборка успешна** (в логе есть `✓ Compiled successfully` и маршруты `○ /`, `ƒ /api/health`), но по `https://app-design-feed.vercel.app/` всё равно 404 — на Production висит **старый деплой**. Нужно переключить Production на последний успешный деплой:

1. Vercel → проект **app-design-feed** → вкладка **Deployments**.
2. Найди деплой с коммитом **d16ae6b** (или любой с зелёным статусом и успешным билдом).
3. Нажми **⋮** (три точки) у этого деплоя → **Promote to Production**.
4. Подожди пару секунд и открой снова `https://app-design-feed.vercel.app/`.

После этого Production будет отдавать новый билд, и 404 с главной и `/api/health` должны пропасть.

---

## Promote недоступен — что проверить

**1. Деплой уже Production**  
Если «Promote to Production» не кликается, этот деплой уже может быть Production. Тогда проблема не в выборе деплоя.

**2. Открой прямой URL деплоя d16ae6b**  
В карточке деплоя есть ссылка вида `https://app-design-feed-xxxxx-….vercel.app` (или «Visit» / «Preview»).

- Если **этот URL открывает ленту** — билд ок, а домен `app-design-feed.vercel.app` привязан к другому деплою или другому проекту (см. п. 4).
- Если **и по этому URL 404** — значит на этом проекте что-то не так с отдачей билда (п. 3).

**3. Output Directory**  
**Settings** → **General** → **Output Directory** — для Next.js должно быть **пусто**. Если там указано что-то (например `out`, `build`, `.next`), очисти поле и сохрани, затем сделай **Redeploy** (лучше с **Clear Build Cache**).

**4. Домен привязан к другому проекту**  
У тебя может быть два проекта с одним репо (например личный и командный).

- Зайди в **каждый** проект с именем типа app-design-feed.
- В каждом: **Settings** → **Domains** — посмотри, где указан **app-design-feed.vercel.app**.
- Домен будет только у одного проекта. Работать с настройками и деплоями нужно в **этом** проекте (там же смотреть Deployments и Promote).

**5. Пересобрать Production**  
В проекте, которому принадлежит домен:

- **Deployments** → деплой d16ae6b (или любой успешный) → **⋮** → **Redeploy**.
- Включи **Clear Build Cache** → Redeploy.
- Дождись окончания. Если Production Branch = `main` и деплой с `main`, он станет новым Production. Проверь снова `https://app-design-feed.vercel.app/`.

---

## Остальные проверки (если 404 остаётся)

1. **Root Directory**  
   **Settings** → **General** → **Root Directory** — оставь **пустым** (или `.`).

2. **Output Directory**  
   **Settings** → **General** → **Output Directory** — для Next.js оставь **пустым** (Vercel сам использует `.next`).

3. **Production Branch**  
   **Settings** → **Git** → **Production Branch** — обычно `main`.

4. **Build Command**  
   Должен выполняться `next build --webpack` (прописан в `package.json`).

5. **Проверка после Promote**  
   - `https://app-design-feed.vercel.app/` — главная с лентой  
   - `https://app-design-feed.vercel.app/api/health` — ответ `{"ok":true}`
