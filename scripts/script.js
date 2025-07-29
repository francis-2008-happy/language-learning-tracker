document.addEventListener('DOMContentLoaded', () => {
    // --- Existing Sidebar Toggle Logic ---
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    function toggleSidebar() {
        document.body.classList.toggle('sidebar-open');
    }

    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', toggleSidebar);
    }

    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }

    const navItems = document.querySelectorAll('.sidebar .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                toggleSidebar();
            }
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024 && document.body.classList.contains('sidebar-open')) {
            document.body.classList.remove('sidebar-open');
        }
    });

    // --- API Integration Logic ---

    // Function to fetch Word of the Day from WordsAPI
    async function fetchWordOfTheDay() {
        const wordElement = document.querySelector('.word-of-day .word');
        const definitionElement = document.querySelector('.word-of-day .definition');
        const pronunciationIconContainer = document.querySelector('.word-of-day .pronunciation-icon');

        // IMPORTANT: Ensure your actual API key is here.
        // It looks like you've already put your key in, which is great!
        const WORDSAPI_KEY = 'dba4ff8e67mshe26c4c7f0aea17cp16fd7cjsncbb17be5de3f'; // Your actual key
        const RAPIDAPI_HOST = 'wordsapiv1.p.rapidapi.com';

        // This check will now effectively pass since you've put in your key
        if (WORDSAPI_KEY === 'YOUR_WORDSAPI_KEY') { // This specific check is now less relevant
             console.warn("WordsAPI Key not set. Please replace 'YOUR_WORDSAPI_KEY' in script.js with your actual key.");
             wordElement.innerHTML = `Bonjour <span class="pronunciation-icon"><i class="fas fa-volume-up"></i></span>`; // Keep placeholder
             definitionElement.textContent = `"French greeting"`; // Keep placeholder
             return;
        }


        try {
            const response = await fetch('https://wordsapiv1.p.rapidapi.com/word/?random=true', {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': WORDSAPI_KEY,
                    'x-rapidapi-host': RAPIDAPI_HOST
                }
            });

            if (!response.ok) {
                console.error(`WordsAPI Error: Status ${response.status}`);
                wordElement.innerHTML = `Error <span class="pronunciation-icon"><i class="fas fa-volume-up"></i></i></span>`;
                definitionElement.textContent = `Could not load word.`;
                return;
            }

            const data = await response.json();
            console.log("WordsAPI response:", data);

            if (data && data.word) {
                wordElement.innerHTML = `${data.word} <span class="pronunciation-icon"><i class="fas fa-volume-up"></i></span>`;

                if (data.results && data.results.length > 0 && data.results[0].definition) {
                    definitionElement.textContent = `"${data.results[0].definition}"`;
                } else {
                    definitionElement.textContent = 'No definition found.';
                }

                if (data.pronunciation && data.pronunciation.all && pronunciationIconContainer) {
                    const audioUrl = `https://media.wordsapi.com/pronunciations/${data.word}.mp3`;
                    const audio = new Audio(audioUrl);
                    
                    pronunciationIconContainer.style.cursor = 'pointer';
                    pronunciationIconContainer.onclick = () => {
                        audio.play().catch(e => console.error("Audio playback error:", e));
                    };
                } else if (pronunciationIconContainer) {
                    pronunciationIconContainer.style.display = 'none';
                }

            } else {
                wordElement.innerHTML = `Word not available <span class="pronunciation-icon"><i class="fas fa-volume-up"></i></span>`;
                definitionElement.textContent = 'Try again later.';
            }

        } catch (error) {
            console.error('Could not fetch word of the day:', error);
            wordElement.innerHTML = `Error <span class="pronunciation-icon"><i class="fas fa-volume-up"></i></span>`;
            definitionElement.textContent = 'Please check your internet connection or API key.';
        }
    }

    // Function to fetch Cultural Fact of the Day from NumbersAPI
    async function fetchCulturalFact() {
        const factElement = document.querySelector('.cultural-fact .fact');

        try {
            const response = await fetch('http://numbersapi.com/random/trivia');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.text();

            if (data) {
                factElement.textContent = data;
            } else {
                factElement.textContent = 'Cultural fact not available.';
            }

        } catch (error) {
            console.error('Could not fetch cultural fact:', error);
            factElement.textContent = 'Error loading fact. Please try again later.';
        }
    }

    // --- Login/Register Modal Logic ---
    const userIcon = document.getElementById('userIcon');
    const authModalOverlay = document.getElementById('authModalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Function to show the modal
    function showAuthModal() {
        authModalOverlay.classList.add('active');
        // Ensure login form is active by default when modal opens
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    }

    // Function to hide the modal
    function hideAuthModal() {
        authModalOverlay.classList.remove('active');
    }

    // Event listener to open modal when user icon is clicked
    if (userIcon) {
        userIcon.addEventListener('click', showAuthModal);
    }

    // Event listener to close modal when close button or overlay is clicked
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', hideAuthModal);
    }
    if (authModalOverlay) {
        // Close if clicking on the overlay itself (not the modal content)
        authModalOverlay.addEventListener('click', (e) => {
            if (e.target === authModalOverlay) {
                hideAuthModal();
            }
        });
    }

    // Event listeners for tab switching
    if (loginTab && registerTab && loginForm && registerForm) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');       // CORRECTED: Show login form
            registerForm.classList.remove('active');  // CORRECTED: Hide register form
        });

        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        });
    }

    // --- Initial API Calls on Page Load ---
    fetchWordOfTheDay();
    fetchCulturalFact();
}); // This closing brace correctly ends the single DOMContentLoaded listener