// Simple registration window display handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('Registration display script loaded');
    
    // Show the registration window by default
    showRegistrationWindow();
    
    // Function to show the registration window
    function showRegistrationWindow() {
        const countdownDiv = document.getElementById('registration-countdown');
        const nextCountdownDiv = document.getElementById('next-registration-countdown');
        const timerSpan = document.getElementById('countdown-timer');
        const registerButton = document.getElementById('register-now-button');
        
        if (countdownDiv && timerSpan && registerButton) {
            // Show the current registration window
            countdownDiv.style.display = 'block';
            if (nextCountdownDiv) {
                nextCountdownDiv.style.display = 'none';
            }
            
            // Set default text
            timerSpan.textContent = 'Registration Open';
            
            // Ensure register button is visible
            registerButton.style.display = 'inline-block';
            
            console.log('Registration window displayed successfully');
        } else {
            console.warn('Registration window elements not found');
        }
    }
    
    // Function to update countdown timer (placeholder for future functionality)
    function updateCountdown() {
        const timerSpan = document.getElementById('countdown-timer');
        if (timerSpan) {
            // For now, just show that registration is open
            // In the future, this could show actual countdown based on Firebase settings
            timerSpan.textContent = 'Registration Open';
        }
    }
    
    // Update countdown every minute
    setInterval(updateCountdown, 60000);
    
    // Initial update
    updateCountdown();
});
