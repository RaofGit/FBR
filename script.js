/* Website Loaded */
console.log("The Royal Tax Services Website Loaded");

/* =========================
   SMOOTH SCROLL NAVIGATION
========================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));

        if (target) {
            target.scrollIntoView({
                behavior: "smooth"
            });
        }
    });
});

/* =========================
   CONTACT FORM HANDLING
========================= */
const form = document.querySelector(".contact-form");

if (form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        // Simple form validation message
        alert("Thank you! Your message has been sent. We will contact you soon.");

        // Reset form after submit
        form.reset();

        // (Future) Here you can connect email API or backend
    });
}

/* =========================
   WHATSAPP CLICK TRACKING
========================= */
const whatsappButtons = document.querySelectorAll('a[href*="wa.me"]');

whatsappButtons.forEach(btn => {
    btn.addEventListener("click", function () {
        console.log("WhatsApp Clicked");

        // Future: Google Ads Conversion Event
        // gtag('event', 'conversion', { 'send_to': 'AW-CONVERSION_ID' });
    });
});

/* =========================
   CTA BUTTON TRACKING
========================= */
const ctaButtons = document.querySelectorAll(".cta-btn");

ctaButtons.forEach(btn => {
    btn.addEventListener("click", function () {
        console.log("CTA Clicked");

        // Future Google Ads tracking
    });
});

/* =========================
   SIMPLE PAGE LOAD EVENT
========================= */
window.addEventListener("load", function () {
    console.log("Page fully loaded and ready");
});
