interface FormDraft {
    [key: string]: string | string[];
}

interface RegistrationResponse {
    success: boolean;
    studentId?: string;
    error?: string;
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm') as HTMLFormElement | null;
    const draftStatus = document.getElementById('draft-status') as HTMLDivElement | null;
    const successCard = document.getElementById('successCard') as HTMLDivElement | null;
    const generatedIdSpan = document.getElementById('generated-id') as HTMLSpanElement | null;
    const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement | null;
    const errorToast = document.getElementById('errorToast') as HTMLDivElement | null;
    const errorToastList = document.getElementById('errorToastList') as HTMLUListElement | null;

    const DRAFT_KEY = 'kite_registration_draft_v1';

    if (!form || !draftStatus || !successCard || !generatedIdSpan || !submitBtn || !errorToast || !errorToastList) return;

    // Helper: Set or Clear Field Error UI
    const setError = (element: HTMLElement | null, message: string | null) => {
        if (!element) return;
        const group = element.closest('.input-group');
        const errorSpan = group?.querySelector('.field-error') as HTMLSpanElement;

        if (message) {
            group?.classList.add('has-error');
            if (errorSpan) {
                errorSpan.textContent = message;
                errorSpan.style.display = 'block';
            }
        } else {
            group?.classList.remove('has-error');
            if (errorSpan) {
                errorSpan.style.display = 'none';
                errorSpan.textContent = '';
            }
        }
    };

    // Validation Rules
    const validateField = (input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean => {
        const val = input.value.trim();

        // 1. Required Check
        if (input.hasAttribute('required') && !val && input.type !== 'file' && input.type !== 'radio') {
            setError(input, 'This field is required');
            return false;
        }

        // 2. Specific Field Rules
        switch (input.id) {
            case 'email':
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (val && !emailRegex.test(val)) {
                    setError(input, 'Enter a valid email address (e.g. user@domain.com)');
                    return false;
                }
                break;

            case 'password':
                // Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
                const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!\%*?&]{8,}$/;
                if (val && !passRegex.test(input.value)) { // keep exact string for space sensitive
                    setError(input, 'Password must be 8+ chars with uppercase, lowercase, number & symbol');
                    return false;
                }
                break;

            case 'firstName':
            case 'lastName':
            case 'emergencyName':
            case 'emergencyRel':
                const nameRegex = /^[a-zA-Z\s'-]{2,30}$/;
                if (val && !nameRegex.test(val)) {
                    setError(input, 'Must contain letters only (minimum 2 characters)');
                    return false;
                }
                break;

            case 'phone':
            case 'emergencyPhone':
                if (val) {
                    if (/[^\d]/.test(val)) {
                        setError(input, 'Phone number must contain numbers only');
                        return false;
                    }
                    if (val.length !== 10) {
                        setError(input, `Phone number must be exactly 10 digits (Currently ${val.length})`);
                        return false;
                    }
                }
                break;

            case 'address':
                if (val && val.length < 10) {
                    setError(input, 'Address must be at least 10 characters long');
                    return false;
                }
                break;

            case 'dob':
                if (val) {
                    const birthYear = new Date(val).getFullYear();
                    const currentYear = new Date().getFullYear();
                    const age = currentYear - birthYear;
                    if (isNaN(age) || age < 15 || age > 80) {
                        setError(input, 'Age must be between 15 and 80 years');
                        return false;
                    }
                }
                break;

            case 'marksheet':
                const fileInput = input as HTMLInputElement;
                if (fileInput.hasAttribute('required') && (!fileInput.files || fileInput.files.length === 0)) {
                    setError(input, 'Please upload your 12th Marksheet PDF');
                    return false;
                }
                if (fileInput.files && fileInput.files[0]) {
                    const file = fileInput.files[0];
                    if (file.type !== 'application/pdf') {
                        setError(input, 'Only PDF documents are allowed');
                        return false;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                        setError(input, 'File size must not exceed 5MB');
                        return false;
                    }
                }
                break;
        }

        setError(input, null);
        return true;
    };

    // Attach Input Event Listeners
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea').forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            // Clear error while typing if it becomes valid
            if (input.closest('.input-group')?.classList.contains('has-error')) {
                validateField(input);
            }
        });
    });

    // Auto-Save Draft
    const restoreDraft = (): void => {
        const savedData = localStorage.getItem(DRAFT_KEY);
        if (!savedData) return;

        try {
            const formData: FormDraft = JSON.parse(savedData);
            Object.keys(formData).forEach((key) => {
                const elements = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${key}"]`);
                elements.forEach((element) => {
                    if (element instanceof HTMLInputElement && (element.type === 'radio' || element.type === 'checkbox')) {
                        const val = formData[key];
                        if (Array.isArray(val)) {
                            element.checked = val.includes(element.value);
                        } else {
                            element.checked = element.value === val;
                        }
                    } else if (element.type !== 'file') {
                        const val = formData[key];
                        if (typeof val === 'string') {
                            element.value = val;
                        }
                    }
                });
            });
            draftStatus.classList.remove('hidden');
        } catch (e) {
            console.error('Failed to parse draft from storage', e);
        }
    };

    const saveDraft = (): void => {
        const formData: FormDraft = {};
        const data = new FormData(form);

        data.forEach((value, key) => {
            if (key === 'password' || key === 'marksheet') return;
            if (typeof value === 'string') {
                if (formData[key]) {
                    if (!Array.isArray(formData[key])) {
                        formData[key] = [formData[key] as string];
                    }
                    (formData[key] as string[]).push(value);
                } else {
                    formData[key] = value;
                }
            }
        });

        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        draftStatus.classList.remove('hidden');
    };

    let draftTimeout: ReturnType<typeof setTimeout>;
    form.addEventListener('input', () => {
        clearTimeout(draftTimeout);
        draftTimeout = setTimeout(saveDraft, 400);
    });

    // Form Submission Handler
    form.addEventListener('submit', async (e: SubmitEvent) => {
        e.preventDefault();
        let isValid = true;
        const errorMessages: string[] = [];

        // 1. Validate all standard inputs
        const inputs = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea');
        inputs.forEach(input => {
            if (input.type === 'radio') return;
            if (!validateField(input)) {
                isValid = false;
            }
        });

        // 2. Validate Minority Quota Radio Group
        const quotaChecked = form.querySelector<HTMLInputElement>('input[name="minorityQuota"]:checked');
        const quotaGroup = document.getElementById('minorityQuotaGroup');
        if (!quotaChecked) {
            isValid = false;
            setError(quotaGroup, 'Please select whether minority quota applies');
            errorMessages.push('Select Minority Quota status');
        } else {
            setError(quotaGroup, null);
        }

        // Collect visible error text for toast banner
        form.querySelectorAll('.input-group.has-error .field-error').forEach(err => {
            if (err.textContent && !errorMessages.includes(err.textContent)) {
                errorMessages.push(err.textContent);
            }
        });

        // If any error exists, show toast and stop submission
        if (!isValid || errorMessages.length > 0) {
            errorToastList.innerHTML = '';
            errorMessages.slice(0, 4).forEach(msg => {
                const li = document.createElement('li');
                li.textContent = msg;
                errorToastList.appendChild(li);
            });

            errorToast.classList.add('visible');

            const firstErrorGroup = form.querySelector('.input-group.has-error');
            if (firstErrorGroup) {
                firstErrorGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            setTimeout(() => {
                errorToast.classList.remove('visible');
            }, 6000);

            return;
        }

        // 3. Send Data to Server Database
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const formData = new FormData(form);

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                body: formData
            });

            const result: RegistrationResponse = await response.json();

            if (response.ok && result.success && result.studentId) {
                localStorage.removeItem(DRAFT_KEY);
                form.classList.add('hidden');
                generatedIdSpan.textContent = result.studentId;
                successCard.classList.remove('hidden');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                alert('Database Save Error: ' + (result.error || 'Server rejected submission.'));
            }
        } catch (error) {
            console.error('Submission Error:', error);
            alert('Unable to connect to backend server. Make sure node server is running.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Registration';
        }
    });

    restoreDraft();
});