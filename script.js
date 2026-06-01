// Welcome message
console.log("Tech Services Website Loaded");

// Button click alert (example for contact button)
function contactNow() {
    alert("Thank you for contacting us! We will respond soon.");
}

// Smooth scroll effect for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function(e) {
        e.preventDefault();
        document.querySelector(this.getAttribute("href")).scrollIntoView({
            behavior: "smooth"
        });
    });
});