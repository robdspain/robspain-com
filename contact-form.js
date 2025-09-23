// Mailgun Contact Form Handler
class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.submitBtn = document.getElementById('contact-submit');
        this.statusDiv = document.getElementById('contact-status');

        // Mailgun configuration (replace with your actual values)
        this.MAILGUN_DOMAIN = 'YOUR_MAILGUN_DOMAIN'; // e.g., 'mg.yourdomain.com'
        this.MAILGUN_API_KEY = 'YOUR_MAILGUN_API_KEY'; // Your Mailgun API key
        this.TO_EMAIL = 'rob@robspain.com'; // Your email address

        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Get form data
        const formData = new FormData(this.form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        // Validate form
        if (!this.validateForm(data)) {
            return;
        }

        // Update UI
        this.setLoading(true);

        try {
            await this.sendEmail(data);
            this.showSuccess();
            this.form.reset();
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    validateForm(data) {
        // Reset previous error states
        this.clearErrors();

        let isValid = true;

        // Name validation
        if (!data.name || data.name.trim().length < 2) {
            this.showFieldError('name', 'Please enter your full name');
            isValid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }

        // Subject validation
        if (!data.subject) {
            this.showFieldError('subject', 'Please select a subject');
            isValid = false;
        }

        // Message validation
        if (!data.message || data.message.trim().length < 10) {
            this.showFieldError('message', 'Please enter a message (at least 10 characters)');
            isValid = false;
        }

        return isValid;
    }

    async sendEmail(data) {
        // Send data to serverless function
        const response = await this.callMailgunAPI(data);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to send message. Please try again.');
        }

        return response;
    }

    async callMailgunAPI(emailData) {
        // Call the Netlify serverless function
        return fetch('/.netlify/functions/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });
    }

    setLoading(loading) {
        if (loading) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = 'Send Message';
        }
    }

    showSuccess() {
        this.statusDiv.style.display = 'block';
        this.statusDiv.className = 'status-success';
        this.statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> Message sent successfully! I\'ll get back to you soon.';
    }

    showError(message) {
        this.statusDiv.style.display = 'block';
        this.statusDiv.className = 'status-error';
        this.statusDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    }

    showFieldError(fieldName, message) {
        const field = document.getElementById(fieldName);
        if (field) {
            field.classList.add('error');

            // Remove existing error message
            const existingError = field.parentNode.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }

            // Add new error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.textContent = message;
            field.parentNode.appendChild(errorDiv);
        }
    }

    clearErrors() {
        // Clear field errors
        const errorFields = document.querySelectorAll('.error');
        errorFields.forEach(field => field.classList.remove('error'));

        const errorMessages = document.querySelectorAll('.field-error');
        errorMessages.forEach(msg => msg.remove());

        // Hide status message
        this.statusDiv.style.display = 'none';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ContactFormHandler();
});