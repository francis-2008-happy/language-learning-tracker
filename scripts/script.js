document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    const userIcon = document.getElementById('userIcon');
    const authModalOverlay = document.getElementById('authModalOverlay');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const welcomeUsernameSpan = document.getElementById('welcomeUsername');
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');

    // --- Constants ---
    const USERS_STORAGE_KEY = 'languageLearningUsers';
    const CURRENT_USER_STORAGE_KEY = 'languageLearningCurrentUser';

    // --- Sidebar Logic ---
    function toggleSidebar() {
        document.body.classList.toggle('sidebar-open');
    }

    if (hamburgerMenu) hamburgerMenu.addEventListener('click', toggleSidebar);
    if (overlay) overlay.addEventListener('click', toggleSidebar);

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
    async function fetchWordOfTheDay() {
        const wordElement = document.querySelector('.word-of-day .word');
        const definitionElement = document.querySelector('.word-of-day .definition');
        const WORDSAPI_KEY = 'dba4ff8e67mshe26c4c7f0aea17cp16fd7cjsncbb17be5de3f';
        const RAPIDAPI_HOST = 'wordsapiv1.p.rapidapi.com';
        const OPENAI_API_KEY = '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';

        try {
            const wordsApiResponse = await fetch('https://wordsapiv1.p.rapidapi.com/words/?random=true', {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': WORDSAPI_KEY,
                    'x-rapidapi-host': RAPIDAPI_HOST
                },
                cache: 'no-store'
            });

            if (!wordsApiResponse.ok) {
                console.error(`WordsAPI Error: Status ${wordsApiResponse.status}`);
                wordElement.innerHTML = `Error`;
                definitionElement.textContent = `Could not load word.`;
                return;
            }

            const wordsApiData = await wordsApiResponse.json();
            if (wordsApiData && wordsApiData.word) {
                const word = wordsApiData.word;
                wordElement.innerHTML = `${word} <span class="pronunciation-icon"><i class="fas fa-volume-up"></i></span>`;
                definitionElement.textContent = wordsApiData.results && wordsApiData.results.length > 0 ? `"${wordsApiData.results[0].definition}"` : 'No definition found.';
                
                const pronunciationIconContainer = document.querySelector('.word-of-day .pronunciation-icon');
                if (OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-proj')) {
                    try {
                        const openAIAudioResponse = await fetch('https://api.openai.com/v1/audio/speech', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ model: 'tts-1', input: word, voice: 'alloy' })
                        });

                        if (openAIAudioResponse.ok) {
                            const audioBuffer = await openAIAudioResponse.arrayBuffer();
                            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                            const decodedBuffer = await audioContext.decodeAudioData(audioBuffer);
                            
                            if (pronunciationIconContainer) {
                                pronunciationIconContainer.onclick = () => {
                                    if (audioContext.state === 'suspended') audioContext.resume();
                                    const source = audioContext.createBufferSource();
                                    source.buffer = decodedBuffer;
                                    source.connect(audioContext.destination);
                                    source.start(0);
                                };
                                pronunciationIconContainer.style.cursor = 'pointer';
                            }
                        } else {
                            if (pronunciationIconContainer) pronunciationIconContainer.style.display = 'none';
                        }
                    } catch (ttsError) {
                        if (pronunciationIconContainer) pronunciationIconContainer.style.display = 'none';
                    }
                } else {
                    if (pronunciationIconContainer) pronunciationIconContainer.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Could not fetch word of the day:', error);
        }
    }

    async function fetchCulturalFact() {
        const factElement = document.querySelector('.cultural-fact .fact');
        try {
            const response = await fetch('http://numbersapi.com/random/trivia');
            if (response.ok) {
                factElement.textContent = await response.text();
            }
        } catch (error) {
            console.error('Could not fetch cultural fact:', error);
        }
    }

    // --- Auth Modal Logic ---
    function showAuthModal() {
        if (authModalOverlay) authModalOverlay.classList.add('active');
    }

    function hideAuthModal() {
        if (authModalOverlay) authModalOverlay.classList.remove('active');
    }

    if (userIcon) userIcon.addEventListener('click', showAuthModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', hideAuthModal);
    if (authModalOverlay) {
        authModalOverlay.addEventListener('click', (e) => {
            if (e.target === authModalOverlay) hideAuthModal();
        });
    }

    if (loginTab && registerTab) {
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        });

        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        });
    }

    // --- User Authentication Logic ---
    async function hashPassword(password) {
        const data = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function registerUserHandler(e) {
        e.preventDefault();
        const username = registerForm.registerUsername.value.trim();
        const password = registerForm.registerPassword.value;
        const messageElement = document.getElementById('registerError');

        if (password !== registerForm.confirmPassword.value) {
            messageElement.textContent = 'Passwords do not match.';
            return;
        }

        let users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || {};
        if (users[username]) {
            messageElement.textContent = 'Username already exists.';
            return;
        }

        users[username] = { password: await hashPassword(password) };
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        messageElement.textContent = 'Registration successful! Please log in.';
        messageElement.className = 'error-message success';
        registerForm.reset();
        loginTab.click();
    }

    async function loginUserHandler(e) {
        e.preventDefault();
        const username = loginForm.loginUsername.value.trim();
        const password = loginForm.loginPassword.value;
        const messageElement = document.getElementById('loginError');
        
        let users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY)) || {};
        const hashedPassword = await hashPassword(password);

        if (users[username] && users[username].password === hashedPassword) {
            localStorage.setItem(CURRENT_USER_STORAGE_KEY, username);
            loginForm.reset();
            updateAuthUI();
        } else {
            messageElement.textContent = 'Invalid username or password.';
        }
    }

    function logoutUser() {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
        updateAuthUI();
    }

    function updateAuthUI() {
        const loggedInUsername = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        if (loggedInUsername) {
            userIcon.style.display = 'none';
            logoutButtonHeader.style.display = 'inline-block';
            welcomeUsernameSpan.textContent = `Welcome, ${loggedInUsername}`;
            welcomeUsernameSpan.style.display = 'inline';
            hideAuthModal();
        } else {
            userIcon.style.display = 'inline-block';
            logoutButtonHeader.style.display = 'none';
            welcomeUsernameSpan.style.display = 'none';
        }
    }

    // --- Event Listeners for Auth ---
    if (registerForm) registerForm.addEventListener('submit', registerUserHandler);
    if (loginForm) loginForm.addEventListener('submit', loginUserHandler);
    if (logoutButtonHeader) logoutButtonHeader.addEventListener('click', logoutUser);
    

    // --- Initial Page Load Calls ---
    updateAuthUI();
    fetchWordOfTheDay();
    fetchCulturalFact();
});
