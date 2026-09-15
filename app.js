"use strict";
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const dob = document.getElementById('dob');
    const successMessage = document.getElementById('successMessage');
    const studentIdBadge = document.getElementById('generated-id');
    // Validate that the student is old enough (born on or before 2009-12-31)
    // They must have completed high school to be eligible for enrollment
    function validateAge() {
        const dobValue = dob.value;
        if (!dobValue)
            return false;
        const birthDate = new Date(dobValue);
        const cutoffDate = new Date('2009-12-31');
        if (birthDate > cutoffDate) {
            dob.setCustomValidity('You must have completed high school to enroll. Date of birth must be on or before December 31, 2009.');
            return false;
        }
        else {
            dob.setCustomValidity('');
            return true;
        }
    }
    dob.addEventListener('input', validateAge);
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        validateAge();
        if (form.checkValidity()) {
            // Generate random student ID
            const year = new Date().getFullYear();
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            const studentId = `KITE-${year}-${randomNum}`;
            // Show success message and hide form
            studentIdBadge.textContent = studentId;
            form.style.display = 'none';
            successMessage.style.display = 'block';
        }
        else {
            // Let the browser show native validation tooltips
            form.reportValidity();
        }
    });
});
