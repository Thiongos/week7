document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');
    
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent the default form submission
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                alert('Login successful!');
                // Store token in local storage or session storage
                localStorage.setItem('authToken', data.token);
                // Redirect to dashboard
                window.location.href = '/dashboard.html'; // Update to the actual path of your dashboard
            } else {
                const errorData = await response.json();
                alert(`Login failed: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred during login.');
        }
    });
});
