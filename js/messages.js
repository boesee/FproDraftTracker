// Dismissible feedback messages. Implements UC-005
// (docs/use_cases/UC-005-fehler-feedback-erhalten.md).

const ERROR_TIMEOUT_MS = 5000; // BR-002
const SUCCESS_TIMEOUT_MS = 3000; // BR-002

export function createMessageCenter(errorEl, successEl) {
  let errorTimer = null;
  let successTimer = null;

  function hide(el) {
    el.hidden = true;
  }

  // BR-003: showing one message type hides the other immediately.
  function showError(message) {
    clearTimeout(successTimer);
    hide(successEl);
    errorEl.textContent = message;
    errorEl.hidden = false;
    clearTimeout(errorTimer);
    errorTimer = setTimeout(() => hide(errorEl), ERROR_TIMEOUT_MS);
  }

  function showSuccess(message) {
    clearTimeout(errorTimer);
    hide(errorEl);
    successEl.textContent = message;
    successEl.hidden = false;
    clearTimeout(successTimer);
    successTimer = setTimeout(() => hide(successEl), SUCCESS_TIMEOUT_MS);
  }

  return { showError, showSuccess };
}
