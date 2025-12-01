// modules/toasts.js

let toastEl, toastIcon, toastText;

export function initToasts() {
  toastEl = document.getElementById("toast");
  toastIcon = document.getElementById("toastIcon");
  toastText = document.getElementById("toastText");
}

export function showToast(message, isError = false) {
  if (!toastEl || !toastIcon || !toastText) return;
  toastText.textContent = message;
  toastIcon.textContent = isError ? "⚠" : "✔";

  toastEl.classList.remove("toast-ok", "toast-err");
  toastEl.classList.add(isError ? "toast-err" : "toast-ok");
  toastEl.classList.add("show");

  setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2600);
}

