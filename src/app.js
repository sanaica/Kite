document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch DOM Elements
    const form = document.getElementById('registrationForm');
    const draftStatus = document.getElementById('draft-status');
    const successCard = document.getElementById('successCard');
    const generatedIdSpan = document.getElementById('generated-id');
    const cardName = document.getElementById('card-name');
    const cardProgram = document.getElementById('card-program');
    const cardTerm = document.getElementById('card-term');
    const submitBtn = document.getElementById('submitBtn');
    const errorToast = document.getElementById('errorToast');
    const errorToastList = document.getElementById('errorToastList');

    const DRAFT_KEY = 'kite_registration_draft_v1';

    if (!form) {
        console.error("Critical Error: '#registrationForm' not found in DOM.");
        return;
    }

    // 2. Real-Time Input Sanitization
    const phoneInputs = [document.getElementById('phone'), document.getElementById('emergencyPhone')];
    phoneInputs.forEach(input => {
        if (!input) return;
        input.addEventListener('input', () => {
            input.value = input.value.replace(/\D/g, '').slice(0, 10);
            validateField(input);
        });
    });

    const nameInputs = [document.getElementById('firstName'), document.getElementById('lastName'), document.getElementById('emergencyName')];
    nameInputs.forEach(input => {
        if (!input) return;
        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
            validateField(input);
        });
    });

    // 3. Attach Live Validation & Draft Saving
    const allFormControls = Array.from(form.querySelectorAll('input, select, textarea'));
    allFormControls.forEach(control => {
        control.addEventListener('blur', () => validateField(control));
        control.addEventListener('input', () => {
            saveDraft();
            if (control.classList.contains('is-invalid')) {
                validateField(control);
            }
        });
        control.addEventListener('change', () => {
            saveDraft();
            validateField(control);
        });
    });

    // 4. Field Validation Logic
    function validateField(input) {
        if (!input || (!input.name && !input.id)) return true;

        let isValid = true;
        let errorMessage = '';
        const value = input.value.trim();

        // Radio Group Validation
        if (input.type === 'radio') {
            const radioName = input.name;
            const checked = form.querySelector(`input[name="${radioName}"]:checked`);
            const radioContainer = input.closest('.form-group');
            if (!checked) {
                isValid = false;
                errorMessage = 'Please select an option.';
            }
            setFieldError(radioContainer || input, isValid ? '' : errorMessage);
            return isValid;
        }

        const isRequired = input.hasAttribute('required');

        if (isRequired && !value && input.type !== 'file') {
            isValid = false;
            errorMessage = 'This field is required.';
        } else if (input.type === 'file' && isRequired && input.files.length === 0) {
            isValid = false;
            errorMessage = 'Please upload your marksheet PDF.';
        } else if (value) {
            if (input.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address.';
                }
            } else if (input.id === 'password') {
                const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!\%*?&]{8,}$/;
                if (!passwordRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Password must have 8+ chars, 1 uppercase, 1 lowercase, 1 number, and 1 special char.';
                }
            } else if (input.id === 'phone' || input.id === 'emergencyPhone') {
                if (value.length !== 10) {
                    isValid = false;
                    errorMessage = 'Phone number must be exactly 10 digits.';
                }
            } else if (input.type === 'file' && input.files.length > 0) {
                const file = input.files[0];
                if (file.type !== 'application/pdf') {
                    isValid = false;
                    errorMessage = 'Only PDF files are allowed.';
                } else if (file.size > 5 * 1024 * 1024) {
                    isValid = false;
                    errorMessage = 'File size must be under 5MB.';
                }
            }
        }

        setFieldError(input, isValid ? '' : errorMessage);
        return isValid;
    }

    function setFieldError(element, message) {
        const container = element.classList.contains('form-group') ? element : element.parentElement;
        const input = element.classList.contains('form-group') ? element.querySelector('input, select, textarea') : element;
        const errorSpan = container ? container.querySelector('.field-error') : null;

        if (message) {
            if (input) {
                input.classList.add('is-invalid');
                input.classList.remove('is-valid');
            }
            if (errorSpan) {
                errorSpan.textContent = message;
                errorSpan.style.display = 'block';
            }
        } else {
            if (input) {
                input.classList.remove('is-invalid');
                if (input.value && input.value.trim()) input.classList.add('is-valid');
            }
            if (errorSpan) {
                errorSpan.textContent = '';
                errorSpan.style.display = 'none';
            }
        }
    }

    // 5. Local Storage Draft Management
    function saveDraft() {
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            if (typeof value === 'string' && key !== 'password') data[key] = value;
        });
        localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
        if (draftStatus) draftStatus.textContent = 'Draft auto-saved locally';
    }

    function loadDraft() {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (!saved) return;
        try {
            const data = JSON.parse(saved);
            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field && field.type !== 'file' && field.type !== 'radio') {
                    field.value = data[key];
                } else if (field && field.type === 'radio') {
                    const radio = form.querySelector(`input[name="${key}"][value="${data[key]}"]`);
                    if (radio) radio.checked = true;
                }
            });
            if (draftStatus) draftStatus.textContent = 'Restored saved draft';
        } catch (e) {
            console.error('Draft restore error:', e);
        }
    }

    loadDraft();

    // 6. Form Submission & ID Card Generator
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect Validation Errors across all fields
        const errors = [];
        const requiredInputs = form.querySelectorAll('input, select, textarea');

        requiredInputs.forEach(input => {
            const isValid = validateField(input);
            if (!isValid) {
                const label = form.querySelector(`label[for="${input.id}"]`) || input.closest('.form-group')?.querySelector('label');
                const labelName = label ? label.innerText.replace('*', '').trim() : (input.name || 'Field');
                const errText = input.closest('.form-group')?.querySelector('.field-error')?.textContent || 'Invalid value';

                if (!errors.some(err => err.includes(labelName))) {
                    errors.push(`${labelName}: ${errText}`);
                }
            }
        });

        // IF INVALID: Display Error Toast Banner
        if (errors.length > 0) {
            if (errorToastList) {
                errorToastList.innerHTML = errors.map(err => `<li>${err}</li>`).join('');
            }
            if (errorToast) {
                errorToast.style.display = 'block';
                errorToast.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }

        // IF VALID: Clear Toast & Process ID Card
        if (errorToast) errorToast.style.display = 'none';

        try {
            if (submitBtn) submitBtn.disabled = true;

            const formData = new FormData(form);
            let result;

            // Attempt API Call (or fallback gracefully if server is offline)
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    result = await response.json();
                }
            } catch (err) {
                console.warn('Server offline, generating ID Card client-side:', err);
            }

            // Generate Student ID Details
            const generatedId = result?.studentId || 'KITE-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
            const firstName = form.querySelector('#firstName')?.value || '';
            const lastName = form.querySelector('#lastName')?.value || '';
            const programSelect = form.querySelector('#program');
            const termSelect = form.querySelector('#term');

            if (generatedIdSpan) generatedIdSpan.textContent = generatedId;
            if (cardName) cardName.textContent = `${firstName} ${lastName}`;
            if (cardProgram) cardProgram.textContent = programSelect?.options[programSelect.selectedIndex]?.text || '-';
            if (cardTerm) cardTerm.textContent = termSelect?.options[termSelect.selectedIndex]?.text || '-';

            // Hide Form & Render ID Card
            localStorage.removeItem(DRAFT_KEY);
            form.style.display = 'none';
            if (draftStatus) draftStatus.style.display = 'none';
            if (successCard) {
                successCard.style.display = 'block';
                successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

        } catch (error) {
            console.error('Submission failed:', error);
            if (errorToastList) errorToastList.innerHTML = '<li>An unexpected error occurred. Please try again.</li>';
            if (errorToast) errorToast.style.display = 'block';
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
});