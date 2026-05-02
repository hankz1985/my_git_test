const questionInput = document.querySelector("#questionInput");
const generateButton = document.querySelector("#generateButton");
const clearButton = document.querySelector("#clearButton");
const resultPanel = document.querySelector("#resultPanel");
const successMessage = document.querySelector("#successMessage");
const copyToast = document.querySelector("#copyToast");
const shareUrlInput = document.querySelector("#shareUrl");
const copyLinkButton = document.querySelector("#copyLinkButton");
const copyPromptButton = document.querySelector("#copyPromptButton");
const copyOpenDoubaoButton = document.querySelector("#copyOpenDoubaoButton");
const cancelRedirectButton = document.querySelector("#cancelRedirectButton");
const heroTitle = document.querySelector("#heroTitle");
const heroText = document.querySelector("#heroText");
const pageRoot = document.querySelector("#pageRoot");
const composerPanel = document.querySelector("#composerPanel");
const viewerPanel = document.querySelector("#viewerPanel");
const linkPanel = document.querySelector("#linkPanel");
const shareScene = document.querySelector("#shareScene");
const viewerHint = document.querySelector("#viewerHint");
const promptCard = document.querySelector("#promptCard");
const promptContent = document.querySelector("#promptContent");
const redirectHint = document.querySelector("#redirectHint");
const emptyState = document.querySelector("#emptyState");
const shareTip = document.querySelector("#shareTip");
const teaseLine = document.querySelector("#teaseLine");
const promptActions = document.querySelector("#promptActions");
const cursorStage = document.querySelector("#cursorStage");
const fakeCursor = document.querySelector("#fakeCursor");
const fakeClick = document.querySelector("#fakeClick");
const memePopup = document.querySelector("#memePopup");
const doubaoUrl = "https://www.doubao.com/";
let manualCopyTextarea = null;
let typingTimer = null;
let redirectTimer = null;
let redirectCountdownTimer = null;
let cursorMoveTimer = null;
let cursorClickTimer = null;
let cursorResetTimer = null;
let memeTimer = null;
const teaseLines = [
  "这个问题，建议你自己去问一下 AI。",
  "问题我帮你贴好了，剩下的你自己去看答案。",
  "别等别人回了，AI 现在就能回你。",
  "别等人回了，答案现在就能有。",
  "你离答案只差最后一步。",
];

function encodeQuestionPayload(question) {
  const utf8Bytes = new TextEncoder().encode(question);
  let binary = "";

  for (const byte of utf8Bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeQuestionPayload(payload) {
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(normalized + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function buildShareUrl(question) {
  const url = new URL(window.location.href);
  url.searchParams.delete("q");
  url.searchParams.set("p", encodeQuestionPayload(question));
  url.hash = "";
  return url.toString();
}

function legacyCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
}

function cleanupManualCopyTextarea() {
  if (manualCopyTextarea) {
    document.body.removeChild(manualCopyTextarea);
    manualCopyTextarea = null;
  }
}

function prepareManualCopy(text) {
  cleanupManualCopyTextarea();
  manualCopyTextarea = document.createElement("textarea");
  manualCopyTextarea.value = text;
  manualCopyTextarea.setAttribute("readonly", "");
  manualCopyTextarea.style.position = "fixed";
  manualCopyTextarea.style.opacity = "0.01";
  manualCopyTextarea.style.left = "16px";
  manualCopyTextarea.style.bottom = "16px";
  manualCopyTextarea.style.width = "1px";
  manualCopyTextarea.style.height = "1px";
  document.body.appendChild(manualCopyTextarea);
  manualCopyTextarea.focus();
  manualCopyTextarea.select();
  manualCopyTextarea.setSelectionRange(0, manualCopyTextarea.value.length);
}

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error(error);
    }
  }

  return legacyCopyText(text);
}

function setTemporaryButtonLabel(button, idleLabel, successLabel) {
  const previous = button.textContent;
  button.textContent = successLabel;
  window.setTimeout(() => {
    button.textContent = idleLabel || previous;
  }, 1400);
}

function showCopyToast(message) {
  copyToast.textContent = message;
  copyToast.classList.remove("hidden");
  window.setTimeout(() => {
    copyToast.classList.add("hidden");
  }, 1400);
}

async function copyText(text, button, idleLabel, successLabel) {
  try {
    const copied = await writeClipboard(text);

    if (!copied) {
      prepareManualCopy(text);
      setTemporaryButtonLabel(button, idleLabel, "已选中，Ctrl+C");
      return false;
    }

    cleanupManualCopyTextarea();
    setTemporaryButtonLabel(button, idleLabel, successLabel);
    return true;
  } catch (error) {
    console.error(error);
    prepareManualCopy(text);
    setTemporaryButtonLabel(button, idleLabel, "已选中，Ctrl+C");
    return false;
  }
}

function updatePlatformLinks(question) {
  const seed = question.length % teaseLines.length;
  teaseLine.textContent = teaseLines[seed];
}

function setShareMode(enabled) {
  document.body.classList.toggle("share-mode", enabled);
  heroTitle.textContent = enabled ? "让我帮你AI一下" : "让我帮你AI一下";
  heroText.textContent = enabled ? "" : "把问题贴进来，生成一个可公开访问的分享链接。";

  if (enabled) {
    viewerPanel.classList.remove("hidden");
    linkPanel.classList.add("hidden");
    shareScene.classList.remove("hidden");
    viewerPanel.scrollIntoView({ block: "start", behavior: "auto" });
  } else {
    viewerPanel.classList.remove("hidden");
    linkPanel.classList.remove("hidden");
    shareScene.classList.add("hidden");
  }
}

function clearShareTimers() {
  if (typingTimer) {
    window.clearTimeout(typingTimer);
    typingTimer = null;
  }

  if (redirectTimer) {
    window.clearTimeout(redirectTimer);
    redirectTimer = null;
  }

  if (redirectCountdownTimer) {
    window.clearInterval(redirectCountdownTimer);
    redirectCountdownTimer = null;
  }

  if (cursorMoveTimer) {
    window.clearTimeout(cursorMoveTimer);
    cursorMoveTimer = null;
  }

  if (cursorClickTimer) {
    window.clearTimeout(cursorClickTimer);
    cursorClickTimer = null;
  }

  if (cursorResetTimer) {
    window.clearTimeout(cursorResetTimer);
    cursorResetTimer = null;
  }

  if (memeTimer) {
    window.clearTimeout(memeTimer);
    memeTimer = null;
  }

  cursorStage.classList.add("hidden");
  fakeCursor.classList.remove("active", "moving", "clicking");
  fakeClick.classList.remove("active");
  memePopup.classList.add("hidden");
  promptActions.classList.remove("reveal-target");
}

function moveCursorTo(x, y) {
  const cardRect = promptCard.getBoundingClientRect();
  const localX = x - cardRect.left;
  const localY = y - cardRect.top;
  fakeCursor.style.left = `${localX}px`;
  fakeCursor.style.top = `${localY}px`;
  fakeClick.style.left = `${localX}px`;
  fakeClick.style.top = `${localY}px`;
}

function getButtonPoint() {
  const rect = promptActions.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.5,
    y: rect.top + Math.max(24, rect.height * 0.45),
  };
}

function startFakeCursorSequence() {
  cursorStage.classList.remove("hidden");
  fakeCursor.classList.add("active");
}

function startRedirectCountdown() {
  let remaining = 8;
  redirectHint.classList.add("hidden");
  cancelRedirectButton.classList.remove("hidden");
  const buttonPoint = getButtonPoint();
  const cardRect = promptCard.getBoundingClientRect();
  const startX = buttonPoint.x;
  const startY = Math.max(buttonPoint.y - 170, cardRect.top + 88);

  startFakeCursorSequence();
  moveCursorTo(startX, startY);

  redirectCountdownTimer = window.setInterval(() => {
    remaining -= 1;

    if (remaining <= 0) {
      window.clearInterval(redirectCountdownTimer);
      redirectCountdownTimer = null;
      return;
    }
  }, 1000);

  cursorMoveTimer = window.setTimeout(() => {
    moveCursorTo(buttonPoint.x, buttonPoint.y);
  }, 80);

  cursorClickTimer = window.setTimeout(() => {
    copyOpenDoubaoButton.classList.remove("hidden");
    promptActions.classList.add("reveal-target");
    fakeCursor.classList.add("clicking");
    fakeClick.classList.remove("active");
    void fakeClick.offsetWidth;
    fakeClick.classList.add("active");
  }, 3000);

  cursorResetTimer = window.setTimeout(() => {
    fakeCursor.classList.remove("clicking");
  }, 5000);

  memeTimer = window.setTimeout(() => {
    cursorStage.classList.add("hidden");
    memePopup.classList.remove("hidden");
    redirectHint.classList.remove("hidden");
    redirectHint.textContent = "man, what can i say, please ask doubao";
  }, 5000);

  redirectTimer = window.setTimeout(() => {
    window.location.href = doubaoUrl;
  }, 8000);
}

function startTypewriter(text) {
  clearShareTimers();
  promptContent.textContent = "";
  promptContent.classList.add("typing");
  redirectHint.classList.add("hidden");
  cancelRedirectButton.classList.add("hidden");
  memePopup.classList.add("hidden");
  cursorStage.classList.add("hidden");

  const duration = 5000;
  const startedAt = Date.now();

  function typeNext() {
    const elapsed = Date.now() - startedAt;
    const progress = Math.min(1, elapsed / duration);
    const count = Math.max(1, Math.floor(progress * text.length));
    promptContent.textContent = text.slice(0, count);

    if (progress < 1) {
      typingTimer = window.setTimeout(typeNext, 50);
      return;
    }

    promptContent.textContent = text;
    promptContent.classList.remove("typing");
    startRedirectCountdown();
  }

  typeNext();
}

function renderPrompt(question, isShareLink = false) {
  const normalized = question.trim();

  if (!normalized) {
    clearShareTimers();
    promptCard.classList.add("empty");
    promptContent.classList.add("hidden");
    promptActions.classList.add("hidden");
    emptyState.classList.remove("hidden");
    teaseLine.classList.add("hidden");
    redirectHint.classList.add("hidden");
    cancelRedirectButton.classList.add("hidden");
    cursorStage.classList.add("hidden");
    promptContent.textContent = "";
    viewerHint.textContent = "当前没有检测到问题参数。生成链接后，这里会同步预览分享效果。";
    resultPanel.classList.add("hidden");
    setShareMode(false);
    return;
  }

  promptCard.classList.remove("empty");
  promptContent.classList.remove("hidden");
  promptActions.classList.remove("hidden");
  emptyState.classList.add("hidden");
  teaseLine.classList.remove("hidden");
  viewerHint.textContent = "问题会先展示出来，然后自动带去豆包。";
  shareTip.textContent = "说明：分享页会做展示动画，然后自动跳去豆包。";
  updatePlatformLinks(normalized);
  setShareMode(true);

  if (isShareLink) {
    copyOpenDoubaoButton.classList.add("hidden");
    startTypewriter(normalized);
  } else {
    clearShareTimers();
    promptContent.classList.remove("typing");
    redirectHint.classList.add("hidden");
    cancelRedirectButton.classList.add("hidden");
    cursorStage.classList.add("hidden");
    memePopup.classList.add("hidden");
    copyOpenDoubaoButton.classList.remove("hidden");
    promptContent.textContent = normalized;
  }
}

async function syncFromQuestion(question) {
  const normalized = question.trim();
  const shareUrl = buildShareUrl(normalized);

  shareUrlInput.value = shareUrl;
  resultPanel.classList.remove("hidden");
  successMessage.textContent = "链接已生成成功";
  copyToast.classList.add("hidden");
  const copied = await writeClipboard(shareUrl);

  if (copied) {
    successMessage.textContent = "链接已生成成功，已自动复制";
  }

  window.history.replaceState({}, "", window.location.pathname);
}

function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const payload = params.get("p");
  const hasSharePayload = Boolean(payload || params.get("q"));
  let question = "";

  if (payload) {
    try {
      question = decodeQuestionPayload(payload);
    } catch (error) {
      console.error(error);
      question = "";
    }
  } else {
    question = params.get("q") || "";
  }

  if (question) {
    questionInput.value = question;
  }

  if (question.trim()) {
    renderPrompt(question, hasSharePayload);
    shareUrlInput.value = buildShareUrl(question.trim());
    resultPanel.classList.remove("hidden");
  } else {
    renderPrompt("", false);
  }
}

generateButton.addEventListener("click", async () => {
  const question = questionInput.value.trim();

  if (!question) {
    window.alert("先输入一个问题。");
    questionInput.focus();
    return;
  }

  await syncFromQuestion(question);
});

clearButton.addEventListener("click", () => {
  questionInput.value = "";
  shareUrlInput.value = "";
  resultPanel.classList.add("hidden");
  renderPrompt("");
  window.history.replaceState({}, "", window.location.pathname);
  questionInput.focus();
});

copyLinkButton.addEventListener("click", async () => {
  if (!shareUrlInput.value) {
    return;
  }

  const copied = await copyText(shareUrlInput.value, copyLinkButton, "复制链接", "复制成功");

  if (copied) {
    successMessage.textContent = "链接已生成成功";
    showCopyToast("复制成功");
  }
});

copyPromptButton.addEventListener("click", () => {
  const question = promptContent.textContent.trim();

  if (!question) {
    return;
  }

  copyText(question, copyPromptButton, "复制问题", "已复制");
});

copyOpenDoubaoButton.addEventListener("click", async () => {
  const question = promptContent.textContent.trim();

  if (!question) {
    return;
  }

  try {
    clearShareTimers();
    redirectHint.textContent = "已改为手动跳转。";
    redirectHint.classList.remove("hidden");
    cancelRedirectButton.classList.add("hidden");
    copyOpenDoubaoButton.textContent = "正在打开";
    copyOpenDoubaoButton.classList.remove("hidden");

    const openedWindow = window.open(doubaoUrl, "_blank", "noopener,noreferrer");

    if (!openedWindow) {
      window.location.href = doubaoUrl;
    }

    window.setTimeout(() => {
      copyOpenDoubaoButton.textContent = "去问豆包";
    }, 1600);
  } catch (error) {
    console.error(error);
    window.location.href = doubaoUrl;
  }
});

cancelRedirectButton.addEventListener("click", () => {
  clearShareTimers();
  promptContent.classList.remove("typing");
  redirectHint.textContent = "自动跳转已暂停。";
  redirectHint.classList.remove("hidden");
  cancelRedirectButton.classList.add("hidden");
});

loadFromUrl();
