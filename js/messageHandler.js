export class MessageHandler {
    constructor({ logger }) {
        this.logger = logger;
        this.errorTimeout = 5000;
        this.successTimeout = 3000;
    }
    showError(message, details = null) {
        this.hideSuccess();
        const errorElement = document.getElementById('error');
        const errorMsg = document.getElementById('errorMessage');
        if (errorElement && errorMsg) {
            errorMsg.textContent = message + (details ? ` (${details})` : '');
            errorElement.classList.add('show-message');
            setTimeout(() => this.hideError(), this.errorTimeout);
        }
        this.logger.error(message, details || '');
    }
    hideError() {
        const errorElement = document.getElementById('error');
        if (errorElement) errorElement.classList.remove('show-message');
    }
    showSuccess(message) {
        this.hideError();
        const successElement = document.getElementById('success');
        const successMsg = document.getElementById('successMessage');
        if (successElement && successMsg) {
            successMsg.textContent = message;
            successElement.classList.add('show-message');
            setTimeout(() => this.hideSuccess(), this.successTimeout);
        }
        this.logger.info(message);
    }
    hideSuccess() {
        const successElement = document.getElementById('success');
        if (successElement) successElement.classList.remove('show-message');
    }
    showLoading(show = true) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            if (show) {
                loadingElement.classList.add('show-message');
                loadingElement.setAttribute('aria-busy', 'true');
            } else {
                loadingElement.classList.remove('show-message');
                loadingElement.removeAttribute('aria-busy');
            }
        }
        this.logger.debug('Loading:', show ? 'Loading...' : 'Loaded!');
    }
}
