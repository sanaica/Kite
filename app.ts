document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm') as HTMLFormElement;
    const successMessage = document.getElementById('successMessage') as HTMLElement;
    const studentIdBadge = document.getElementById('generated-id') as HTMLElement;

    type FieldElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

    // One entry per field on the form. `validate` returns an error message,
    // or an empty string when the value is fine.
    interface FieldRule {
        id: string;             // unique key (also used for the error element id)
        label: string;          // shown in the popup summary
        els: FieldElement[];    // element(s) that get the red highlight / focus
        host: HTMLElement;      // where the inline error message is placed
        validate: () => string;
    }

    // ------------------------------------------------------------------
    // Requirements — change the numbers / patterns here if the rules change
    // ------------------------------------------------------------------
    const LATIN_LETTER = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF';
    // Letters, with single spaces / hyphens / apostrophes allowed BETWEEN letters
    const NAME_REGEX = new RegExp('^[' + LATIN_LETTER + ']+(?:[ \'\\-][' + LATIN_LETTER + ']+)*$');
    const EMAIL_REGEX = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;
    const PHONE_REGEX = /^[6-9][0-9]{9}$/;                 // 10 digits, starts with 6-9
    const PIN_REGEX = /(^|\D)[1-9][0-9]{2}\s?[0-9]{3}(?![0-9])/; // 6-digit PIN code, e.g. 400001 or 400 001
    const DOB_LATEST = '2009-12-31';    // must have completed high school
    const DOB_EARLIEST = '1900-01-01';
    const MAX_MARKSHEET_MB = 5;         // largest marksheet PDF we accept

    // ------------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------------
    function el(id: string): FieldElement {
        return document.getElementById(id) as FieldElement;
    }

    // Trimmed value (used for everything except the password)
    function val(id: string): string {
        return el(id).value.trim();
    }

    function validateName(label: string, v: string, min: number, max: number): string {
        if (!v) return label + ' is required.';
        if (!NAME_REGEX.test(v)) {
            return label + ' can only contain letters. Spaces, hyphens and apostrophes are allowed between letters.';
        }
        if (v.length < min) return label + ' must be at least ' + min + ' letters long.';
        if (v.length > max) return label + ' must be at most ' + max + ' characters long.';
        return '';
    }

    function validatePhone(label: string, v: string): string {
        if (!v) return label + ' is required.';
        if (/[^0-9]/.test(v)) {
            return label + ' must contain digits only. Remove any letters, spaces or symbols.';
        }
        if (v.length !== 10) {
            return label + ' must be exactly 10 digits (you entered ' + v.length + ').';
        }
        if (!PHONE_REGEX.test(v)) return label + ' must start with 6, 7, 8 or 9.';
        return '';
    }

    // ------------------------------------------------------------------
    // Field validators
    // ------------------------------------------------------------------
    function validateEmail(): string {
        const v = val('email');
        if (!v) return 'Email address is required.';
        if (v.length > 254) return 'Email address is too long.';
        if (!EMAIL_REGEX.test(v) || v.indexOf('..') !== -1 || v.split('@')[0].charAt(0) === '.' || /\.@/.test(v)) {
            return 'Enter a valid email address, like student@example.com.';
        }
        return '';
    }

    function validatePassword(): string {
        const v = el('password').value; // not trimmed on purpose
        if (!v) return 'Password is required.';
        if (/\s/.test(v)) return 'Password cannot contain spaces.';
        if (v.length > 64) return 'Password must be at most 64 characters long.';

        const missing: string[] = [];
        if (v.length < 8) missing.push('at least 8 characters');
        if (!/[A-Z]/.test(v)) missing.push('an uppercase letter');
        if (!/[a-z]/.test(v)) missing.push('a lowercase letter');
        if (!/[0-9]/.test(v)) missing.push('a number');
        if (!/[^A-Za-z0-9]/.test(v)) missing.push('a special character (e.g. @ # $ !)');
        return missing.length ? 'Password must have ' + missing.join(', ') + '.' : '';
    }

    function validateDob(): string {
        const input = el('dob') as HTMLInputElement;
        const v = input.value;
        if (!v) {
            return input.validity.badInput
                ? 'Enter a complete, valid date of birth.'
                : 'Date of birth is required.';
        }
        // YYYY-MM-DD strings compare correctly as plain text
        if (v > DOB_LATEST) {
            return 'You must have completed high school to enroll. Date of birth must be on or before December 31, 2009.';
        }
        if (v < DOB_EARLIEST) return 'Enter a valid date of birth (year 1900 or later).';
        return '';
    }

    function validateQuota(): string {
        const chosen = form.querySelector('input[name="minorityQuota"]:checked');
        return chosen ? '' : 'Select Yes or No for the minority quota.';
    }

    function validateAddress(): string {
        const v = val('address');
        if (!v) return 'Address is required.';
        if (v.length < 10) return 'Address is too short. Include house / flat number, street, city, state and PIN code.';
        if (v.length > 250) return 'Address must be at most 250 characters long.';
        if (!/[A-Za-z]/.test(v)) return 'Address must include a street, city or area name, not just numbers.';
        if (!PIN_REGEX.test(v)) return 'Address must include a valid 6-digit PIN code (e.g. 400001).';
        return '';
    }

    function validateEmergencyPhone(): string {
        const err = validatePhone('Emergency contact number', val('emergencyPhone'));
        if (err) return err;
        if (val('emergencyPhone') === val('phone')) {
            return 'Emergency contact number must be different from your own number.';
        }
        return '';
    }

    function validateRequiredSelect(id: string, message: string): string {
        return el(id).value ? '' : message;
    }

    function validatePrevEducation(): string {
        const v = val('prevEducation');
        if (!v) return ''; // optional
        if (v.length < 3) return 'Previous education must be at least 3 characters, or leave it empty.';
        if (v.length > 100) return 'Previous education must be at most 100 characters long.';
        if (!/[A-Za-z]/.test(v)) return 'Previous education must include a school or college name.';
        return '';
    }

    // Result of peeking inside the chosen file to confirm it really is a PDF
    // (a renamed .jpg or .docx would pass the ".pdf" name check on its own).
    type SignatureState = 'none' | 'pending' | 'ok' | 'bad';
    let marksheetSignature: SignatureState = 'none';

    function validateMarksheet(): string {
        const input = el('marksheet') as HTMLInputElement;
        const file = input.files && input.files[0];
        if (!file) return 'Upload your 12th marksheet as a PDF.';
        if (!/\.pdf$/i.test(file.name) || (file.type !== '' && file.type !== 'application/pdf')) {
            return 'Only PDF files are accepted. Choose a file that ends in .pdf.';
        }
        if (file.size === 0) return 'This file is empty. Choose a valid PDF.';
        if (file.size > MAX_MARKSHEET_MB * 1024 * 1024) {
            const mb = (file.size / (1024 * 1024)).toFixed(1);
            return 'This file is ' + mb + ' MB. The maximum size is ' + MAX_MARKSHEET_MB + ' MB.';
        }
        if (marksheetSignature === 'bad') {
            return 'This file is not a valid PDF. Export or scan your marksheet as a PDF and upload it again.';
        }
        if (marksheetSignature === 'pending') return 'Still checking the file. Try again in a moment.';
        return '';
    }

    // ------------------------------------------------------------------
    // Field list
    // ------------------------------------------------------------------
    function hostOf(e: HTMLElement): HTMLElement {
        return (e.closest('td') as HTMLElement) || (e.parentElement as HTMLElement);
    }

    function rule(id: string, label: string, validate: () => string): FieldRule {
        return { id: id, label: label, els: [el(id)], host: hostOf(el(id)), validate: validate };
    }

    const quotaYes = el('quotaYes');
    const quotaNo = el('quotaNo');

    const rules: FieldRule[] = [
        rule('email', 'Email Address', validateEmail),
        rule('password', 'Password', validatePassword),
        rule('firstName', 'First Name', () => validateName('First name', val('firstName'), 2, 50)),
        rule('lastName', 'Last Name', () => validateName('Last name', val('lastName'), 1, 50)),
        rule('dob', 'Date of Birth', validateDob),
        {
            id: 'minorityQuota',
            label: 'Minority Quota',
            els: [quotaYes, quotaNo],
            host: hostOf(quotaYes),
            validate: validateQuota
        },
        rule('phone', 'Phone Number', () => validatePhone('Phone number', val('phone'))),
        rule('address', 'Full Address', validateAddress),
        rule('emergencyName', 'Emergency Contact Name', () => validateName('Contact name', val('emergencyName'), 2, 50)),
        rule('emergencyRel', 'Relationship', () => validateName('Relationship', val('emergencyRel'), 2, 30)),
        rule('emergencyPhone', 'Emergency Phone Number', validateEmergencyPhone),
        rule('program', 'Program / Course', () => validateRequiredSelect('program', 'Select a program / course.')),
        rule('term', 'Enrollment Term', () => validateRequiredSelect('term', 'Select an enrollment term.')),
        rule('prevEducation', 'Previous Education', validatePrevEducation),
        rule('marksheet', '12th Marksheet (PDF)', validateMarksheet)
    ];

    // ------------------------------------------------------------------
    // Showing / clearing errors
    // ------------------------------------------------------------------
    function showError(r: FieldRule, message: string): void {
        const errorId = r.id + '-error';
        let box = document.getElementById(errorId);
        if (!box) {
            box = document.createElement('div');
            box.id = errorId;
            box.className = 'field-error';
            box.setAttribute('role', 'alert');
            r.host.appendChild(box);
        }
        box.textContent = message;
        box.style.display = message ? 'block' : 'none';

        r.els.forEach((e) => {
            if (message) {
                e.classList.add('invalid');
                e.setAttribute('aria-invalid', 'true');
                e.setAttribute('aria-describedby', errorId);
            } else {
                e.classList.remove('invalid');
                e.removeAttribute('aria-invalid');
                e.removeAttribute('aria-describedby');
            }
        });
    }

    function checkField(r: FieldRule): string {
        const message = r.validate();
        showError(r, message);
        return message;
    }

    // Popup summary shown when the user tries to submit with errors
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.setAttribute('role', 'alert');
    toast.style.display = 'none';
    toast.addEventListener('click', hideToast);
    document.body.appendChild(toast);
    let toastTimer: number | undefined;

    function hideToast(): void {
        toast.style.display = 'none';
        if (toastTimer !== undefined) window.clearTimeout(toastTimer);
    }

    function showToast(failed: FieldRule[]): void {
        toast.textContent = '';
        const title = document.createElement('div');
        title.className = 'error-toast-title';
        title.textContent = failed.length === 1
            ? 'Registration not submitted: 1 field needs fixing'
            : 'Registration not submitted: ' + failed.length + ' fields need fixing';
        toast.appendChild(title);

        const list = document.createElement('ul');
        failed.forEach((r) => {
            const li = document.createElement('li');
            li.textContent = r.label;
            list.appendChild(li);
        });
        toast.appendChild(list);

        toast.style.display = 'block';
        if (toastTimer !== undefined) window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(hideToast, 7000);
    }

    // ------------------------------------------------------------------
    // Live feedback: check a field when the user leaves it, then keep
    // re-checking as they type so the error clears as soon as it's fixed.
    // ------------------------------------------------------------------
    const marksheetRule = rules.filter((r) => r.id === 'marksheet')[0];
    const marksheetInput = el('marksheet') as HTMLInputElement;

    marksheetInput.addEventListener('change', () => {
        const file = marksheetInput.files && marksheetInput.files[0];
        if (!file) {
            marksheetSignature = 'none';
            return;
        }
        marksheetSignature = 'pending';

        const reader = new FileReader();
        reader.onload = () => {
            // Ignore the result if the user has already picked a different file
            if (!marksheetInput.files || marksheetInput.files[0] !== file) return;
            // A PDF starts with "%PDF-" (allowing a little junk before it, as the spec does)
            const bytes = new Uint8Array(reader.result as ArrayBuffer);
            const magic = [0x25, 0x50, 0x44, 0x46, 0x2d];
            let found = false;
            for (let i = 0; i + magic.length <= bytes.length && !found; i++) {
                let match = true;
                for (let j = 0; j < magic.length; j++) {
                    if (bytes[i + j] !== magic[j]) { match = false; break; }
                }
                found = match;
            }
            marksheetSignature = found ? 'ok' : 'bad';
            checkField(marksheetRule);
        };
        reader.onerror = () => {
            marksheetSignature = 'bad';
            checkField(marksheetRule);
        };
        reader.readAsArrayBuffer(file.slice(0, 1024));
    });

    const touched: { [id: string]: boolean } = {};

    rules.forEach((r) => {
        const recheck = () => {
            if (touched[r.id]) checkField(r);
        };
        r.els.forEach((e) => {
            e.addEventListener('blur', () => {
                touched[r.id] = true;
                checkField(r);
            });
            e.addEventListener('input', recheck);
            e.addEventListener('change', () => {
                touched[r.id] = true; // dropdowns, radios and dates fire "change"
                checkField(r);
            });
        });
    });

    // The emergency number depends on the student's own number
    el('phone').addEventListener('input', () => {
        const emergency = rules.filter((r) => r.id === 'emergencyPhone')[0];
        if (touched[emergency.id]) checkField(emergency);
    });

    // ------------------------------------------------------------------
    // Submit
    // ------------------------------------------------------------------
    form.addEventListener('submit', (e: Event) => {
        e.preventDefault();

        const failed: FieldRule[] = [];
        rules.forEach((r) => {
            touched[r.id] = true;
            if (checkField(r)) failed.push(r);
        });

        if (failed.length > 0) {
            showToast(failed);
            failed[0].els[0].focus();
            return;
        }

        hideToast();

        // Generate random student ID
        const year = new Date().getFullYear();
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const studentId = `KITE-${year}-${randomNum}`;

        // Show success message and hide form
        studentIdBadge.textContent = studentId;
        form.style.display = 'none';
        successMessage.style.display = 'block';
    });
});