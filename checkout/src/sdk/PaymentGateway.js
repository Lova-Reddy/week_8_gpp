import './styles.css';

class PaymentGateway {
    constructor(options) {
        this.key = options.key;
        this.merchantId = options.merchantId; // Optional if derived from key
        this.orderId = options.orderId;
        this.onSuccess = options.onSuccess || (() => { });
        this.onFailure = options.onFailure || (() => { });
        this.onClose = options.onClose || (() => { });

        this.baseUrl = 'http://localhost:3001'; // Should be configurable or auto-detected
    }

    open() {
        this.createModal();
        this.setupListeners();
    }

    createModal() {
        // Overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'pg-overlay';

        // Modal Container
        this.modal = document.createElement('div');
        this.modal.className = 'pg-modal';

        // Close Button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.className = 'pg-close-btn';
        closeBtn.onclick = () => this.close();

        // Iframe
        this.iframe = document.createElement('iframe');
        this.iframe.src = `${this.baseUrl}/checkout?key=${this.key}&order_id=${this.orderId}`;
        this.iframe.className = 'pg-iframe';

        this.modal.appendChild(closeBtn);
        this.modal.appendChild(this.iframe);
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
    }

    setupListeners() {
        window.addEventListener('message', this.handleMessage.bind(this));
    }

    handleMessage(event) {
        // Validate origin in production
        // if (event.origin !== this.baseUrl) return;

        const { type, data } = event.data;

        if (type === 'payment_success') {
            this.onSuccess(data);
            this.close();
        } else if (type === 'payment_failed') {
            this.onFailure(data);
        } else if (type === 'close_modal') {
            this.close();
        }
    }

    close() {
        if (this.overlay) {
            document.body.removeChild(this.overlay);
            this.overlay = null;
            this.onClose();
        }
        window.removeEventListener('message', this.handleMessage.bind(this));
    }
}

export default PaymentGateway;
