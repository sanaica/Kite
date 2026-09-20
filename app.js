"use strict";
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const successMessage = document.getElementById('successMessage');
    const studentIdBadge = document.getElementById('generated-id');
    // ------------------------------------------------------------------
    // Requirements — change the numbers / patterns here if the rules change
    // ------------------------------------------------------------------
    const LATIN_LETTER = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF';
    // Letters, with single spaces / hyphens / apostrophes allowed BETWEEN letters
    const NAME_REGEX = new RegExp('^[' + LATIN_LETTER + ']+(?:[ \'\\-][' + LATIN_LETTER + ']+)*$');
    const EMAIL_REGEX = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/;
    const PHONE_REGEX = /^[6-9][0-9]{9}$/; // 10 digits, starts with 6-9
    const PIN_REGEX = /(^|\D)[1-9][0-9]{2}\s?[0-9]{3}(?![0-9])/; // 6-digit PIN code, e.g. 400001 or 400 001
    const DOB_LATEST = '2009-12-31'; // must have completed high school
    const DOB_EARLIEST = '1900-01-01';
    // ------------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------------
    function el(id) {
        return document.getElementById(id);
    }
    // Trimmed value (used for everything except the password)
    function val(id) {
        return el(id).value.trim();
    }
    function validateName(label, v, min, max) {
        if (!v)
            return label + ' is required.';
        if (!NAME_REGEX.test(v)) {
            return label + ' can only contain letters. Spaces, hyphens and apostrophes are allowed between letters.';
        }
        if (v.length < min)
            return label + ' must be at least ' + min + ' letters long.';
        if (v.length > max)
            return label + ' must be at most ' + max + ' characters long.';
        return '';
    }
    function validatePhone(label, v) {
        if (!v)
            return label + ' is required.';
        if (/[^0-9]/.test(v)) {
            return label + ' must contain digits only. Remove any letters, spaces or symbols.';
        }
        if (v.length !== 10) {
            return label + ' must be exactly 10 digits (you entered ' + v.length + ').';
        }
        if (!PHONE_REGEX.test(v))
            return label + ' must start with 6, 7, 8 or 9.';
        return '';
    }
    // ------------------------------------------------------------------
    // Field validators
    // ------------------------------------------------------------------
    function validateEmail() {
        const v = val('email');
        if (!v)
            return 'Email address is required.';
        if (v.length > 254)
            return 'Email address is too long.';
        if (!EMAIL_REGEX.test(v) || v.indexOf('..') !== -1 || v.split('@')[0].charAt(0) === '.' || /\.@/.test(v)) {
            return 'Enter a valid email address, like student@example.com.';
        }
        return '';
    }
    function validatePassword() {
        const v = el('password').value; // not trimmed on purpose
        if (!v)
            return 'Password is required.';
        if (/\s/.test(v))
            return 'Password cannot contain spaces.';
        if (v.length > 64)
            return 'Password must be at most 64 characters long.';
        const missing = [];
        if (v.length < 8)
            missing.push('at least 8 characters');
        if (!/[A-Z]/.test(v))
            missing.push('an uppercase letter');
        if (!/[a-z]/.test(v))
            missing.push('a lowercase letter');
        if (!/[0-9]/.test(v))
            missing.push('a number');
        if (!/[^A-Za-z0-9]/.test(v))
            missing.push('a special character (e.g. @ # $ !)');
        return missing.length ? 'Password must have ' + missing.join(', ') + '.' : '';
    }
    function validateDob() {
        const input = el('dob');
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
        if (v < DOB_EARLIEST)
            return 'Enter a valid date of birth (year 1900 or later).';
        return '';
    }
    function validateQuota() {
        const chosen = form.querySelector('input[name="minorityQuota"]:checked');
        return chosen ? '' : 'Select Yes or No for the minority quota.';
    }
    function validateAddress() {
        const v = val('address');
        if (!v)
            return 'Address is required.';
        if (v.length < 10)
            return 'Address is too short. Include house / flat number, street, city, state and PIN code.';
        if (v.length > 250)
            return 'Address must be at most 250 characters long.';
        if (!/[A-Za-z]/.test(v))
            return 'Address must include a street, city or area name, not just numbers.';
        if (!PIN_REGEX.test(v))
            return 'Address must include a valid 6-digit PIN code (e.g. 400001).';
        return '';
    }
    function validateEmergencyPhone() {
        const err = validatePhone('Emergency contact number', val('emergencyPhone'));
        if (err)
            return err;
        if (val('emergencyPhone') === val('phone')) {
            return 'Emergency contact number must be different from your own number.';
        }
        return '';
    }
    function validateRequiredSelect(id, message) {
        return el(id).value ? '' : message;
    }
    function validatePrevEducation() {
        const v = val('prevEducation');
        if (!v)
            return ''; // optional
        if (v.length < 3)
            return 'Previous education must be at least 3 characters, or leave it empty.';
        if (v.length > 100)
            return 'Previous education must be at most 100 characters long.';
        if (!/[A-Za-z]/.test(v))
            return 'Previous education must include a school or college name.';
        return '';
    }
    // ------------------------------------------------------------------
    // Field list
    // ------------------------------------------------------------------
    function hostOf(e) {
        return e.closest('td') || e.parentElement;
    }
    function rule(id, label, validate) {
        return { id: id, label: label, els: [el(id)], host: hostOf(el(id)), validate: validate };
    }
    const quotaYes = el('quotaYes');
    const quotaNo = el('quotaNo');
    const rules = [
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
        rule('prevEducation', 'Previous Education', validatePrevEducation)
    ];
    // ------------------------------------------------------------------
    // Showing / clearing errors
    // ------------------------------------------------------------------
    function showError(r, message) {
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
            }
            else {
                e.classList.remove('invalid');
                e.removeAttribute('aria-invalid');
                e.removeAttribute('aria-describedby');
            }
        });
    }
    function checkField(r) {
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
    let toastTimer;
    function hideToast() {
        toast.style.display = 'none';
        if (toastTimer !== undefined)
            window.clearTimeout(toastTimer);
    }
    function showToast(failed) {
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
        if (toastTimer !== undefined)
            window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(hideToast, 7000);
    }
    // ------------------------------------------------------------------
    // Live feedback: check a field when the user leaves it, then keep
    // re-checking as they type so the error clears as soon as it's fixed.
    // ------------------------------------------------------------------
    const touched = {};
    rules.forEach((r) => {
        const recheck = () => {
            if (touched[r.id])
                checkField(r);
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
        if (touched[emergency.id])
            checkField(emergency);
    });
    // ------------------------------------------------------------------
    // Submit
    // ------------------------------------------------------------------
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const failed = [];
        rules.forEach((r) => {
            touched[r.id] = true;
            if (checkField(r))
                failed.push(r);
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