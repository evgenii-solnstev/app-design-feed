/**
 * Design Feed — плагин Figma.
 * Экспортирует выбранный фрейм в PNG и отправляет в Design Feed (POST /api/frames).
 * Имя автора берётся из figma.currentUser (логин/имя в Figma). Email в API недоступен.
 */

var uiHtml = typeof __html__ !== "undefined" ? __html__ : "<p>Ошибка загрузки UI. Проверьте, что в папке плагина есть ui.html</p>";
figma.showUI(uiHtml, { width: 300, height: 200 });

function getAuthorName() {
  try {
    var user = figma.currentUser;
    if (user && user.name && typeof user.name === "string" && user.name.trim()) return user.name.trim();
  } catch (e) {}
  return "Anonymous";
}

function getFigmaUrl(node) {
  if (!node || !figma.fileKey) return null;
  const nodeId = node.id.replace(/-/g, ":");
  return `https://www.figma.com/file/${figma.fileKey}?node-id=${nodeId}`;
}

figma.ui.onmessage = async (eventOrMsg) => {
  var msg = eventOrMsg && eventOrMsg.data && eventOrMsg.data.pluginMessage !== undefined
    ? eventOrMsg.data.pluginMessage
    : eventOrMsg;
  try {
    if (!msg || typeof msg !== "object") return;
  if (msg.type === "get-context") {
    const selection = figma.currentPage.selection;
    const hasSelection = selection.length > 0;
    figma.ui.postMessage({
      type: "context",
      hasSelection,
      authorName: getAuthorName(),
    });
    return;
  }

  if (msg.type === "export") {
    const selection = figma.currentPage.selection;

    if (selection.length === 0) {
      figma.ui.postMessage({
        type: "result",
        success: false,
        error: "Выберите фрейм или узел на холсте.",
      });
      return;
    }

    const node = selection[0];
    const authorName = getAuthorName();
    const figmaUrl = getFigmaUrl(node);

    try {
      // Ограничиваем размер: макс. ширина 1200px + JPG (меньше PNG для фреймов с картинками),
      // чтобы не упираться в лимит Vercel (~4.5 MB) и не получать Failed to fetch / таймаут
      const bytes = await node.exportAsync({
        format: "JPG",
        constraint: { type: "WIDTH", value: 1200 },
      });

      figma.ui.postMessage({
        type: "exported",
        bytes: bytes.buffer,
        authorName,
        figmaUrl: figmaUrl || "",
      });
    } catch (e) {
      figma.ui.postMessage({
        type: "result",
        success: false,
        error: (e && e.message) || "Не удалось экспортировать.",
      });
    }
    return;
  }

  if (msg.type === "resize") {
    figma.ui.resize(msg.width, msg.height);
    return;
  }
  } catch (e) {
    figma.notify("Design Feed: " + (e && e.message ? e.message : String(e)), { error: true });
  }
};
  