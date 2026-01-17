// Modern Contact Form Handler with Mailgun Integration
class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.submitBtn = document.getElementById('contact-submit');
        this.statusDiv = document.getElementById('contact-status');

        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', this.handleSubmit.bind(this));

            // Add real-time validation
            this.form.addEventListener('input', this.handleInputValidation.bind(this));
            this.form.addEventListener('blur', this.handleInputValidation.bind(this), true);
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
            this.showError('Please check the highlighted fields and try again.');
            return;
        }

        // Update UI
        this.setLoading(true);

        try {
            await this.sendEmail(data);
            this.showSuccess();
            this.form.reset();
            // Reset form styling after successful submission
            setTimeout(() => this.clearErrors(), 100);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    handleInputValidation(e) {
        if (e.target.matches('#name, #email, #subject, #message')) {
            this.validateSingleField(e.target);
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
        return fetch('/.netlify/functions/send-contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });
    }

    validateSingleField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Clear existing error state
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Validate based on field type
        switch (field.id) {
            case 'name':
                if (!value || value.length < 2) {
                    isValid = false;
                    errorMessage = 'Please enter your full name';
                }
                break;

            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) {
                    isValid = false;
                    errorMessage = 'Email address is required';
                } else if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
                break;

            case 'subject':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please select a subject';
                }
                break;

            case 'message':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Message is required';
                } else if (value.length < 10) {
                    isValid = false;
                    errorMessage = 'Please enter at least 10 characters';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field.id, errorMessage);
        }

        return isValid;
    }

    setLoading(loading) {
        if (loading) {
            this.submitBtn.disabled = true;
            this.submitBtn.innerHTML = `
                <span style="display: inline-block; width: 20px; height: 20px; border: 2px solid white; border-top: 2px solid transparent; border-radius: 50%; margin-right: 8px;" class="animate-spin"></span>
                Sending Message...
            `;
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = 'Send Message';
        }
    }

    showSuccess() {
        this.statusDiv.style.display = 'flex';
        this.statusDiv.className = 'form-status success';
        this.statusDiv.innerHTML = `
            <span style="color: #047857; font-size: 1.2em; margin-right: 8px;">✓</span>
            <span>Thank you! Your message has been sent successfully. I'll get back to you within 24 hours.</span>
        `;

        // Auto-hide success message after 8 seconds
        setTimeout(() => {
            if (this.statusDiv.classList.contains('success')) {
                this.statusDiv.style.display = 'none';
            }
        }, 8000);
    }

    showError(message) {
        this.statusDiv.style.display = 'flex';
        this.statusDiv.className = 'form-status error';
        this.statusDiv.innerHTML = `
            <span style="color: #dc2626; font-size: 1.2em; margin-right: 8px;">⚠</span>
            <span>${message}</span>
        `;
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