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





// Function to fetch Word of the Day from WordsAPI (RapidAPI)
    // Function to fetch Word of the Day
    async function fetchWordOfTheDay() {
        const wordElement = document.querySelector('.word-of-day .word');
        const definitionElement = document.querySelector('.word-of-day .definition');
        const pronunciationIconContainer = document.querySelector('.word-of-day .pronunciation-icon');
        const audioIcon = pronunciationIconContainer.querySelector('i');

        // Your WordsAPI credentials (for fetching word/definition)
        const WORDSAPI_KEY = 'dba4ff8e67mshe26c4c7f0aea17cp16fd7cjsncbb17be5de3f'; // Your RapidAPI Key
        const RAPIDAPI_HOST = 'wordsapiv1.p.rapidapi.com';

        // Your OpenAI API Key (for Text-to-Speech)
        // IMPORTANT: Replace with your actual OpenAI API Key
        const OPENAI_API_KEY = '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'; 

        // if (!WORDSAPI_KEY || WORDSAPI_KEY === 'dba4ff8e67mshe26c4c7f0aea17cp16fd7cjsncbb17be5de3f') {
        //     wordElement.innerHTML = `Bonjour <span class="pronunciation-icon"><i class="fas fa-volume-up"></i></span>`;
        //     definitionElement.textContent = `"French greeting"`;
        //     console.warn("WordsAPI Key not set. Please replace 'YOUR_WORDSAPI_KEY' in script.js with your actual key.");
        //     return;
        // }

        // if (!OPENAI_API_KEY || OPENAI_API_KEY === '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') {
        //     console.warn("OpenAI API Key not set. Audio pronunciation will not work.");
        // }

        try {
            // --- Step 1: Fetch word and definition from WordsAPI ---
            const wordsApiResponse = await fetch('https://wordsapiv1.p.rapidapi.com/words/random', {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': WORDSAPI_KEY,
                    'x-rapidapi-host': RAPIDAPI_HOST
                }
            });

            if (!wordsApiResponse.ok) {
                console.error(`WordsAPI Error: Status ${wordsApiResponse.status}`);
                wordElement.innerHTML = `Error <span class="pronunciation-icon"><i class="fas fa-volume-up"></i></span>`;
                definitionElement.textContent = `Could not load word. Status: ${wordsApiResponse.status}`;
                return;
            }

            const wordsApiData = await wordsApiResponse.json();
            console.log("WordsAPI response:", wordsApiData);

            if (wordsApiData && wordsApiData.word) {
                const word = wordsApiData.word;
                wordElement.innerHTML = `${word} <span class="pronunciation-icon"><i class="fas fa-volume-up"></i></span>`;

                if (wordsApiData.results && wordsApiData.results.length > 0 && wordsApiData.results[0].definition) {
                    definitionElement.textContent = `"${wordsApiData.results[0].definition}"`;
                } else {
                    definitionElement.textContent = 'No definition found.';
                }

                let audioBuffer = null;
                // --- Step 2: Fetch audio pronunciation from OpenAI TTS API ---
                if (OPENAI_API_KEY && OPENAI_API_KEY !== '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') {
                    try {
                        const openAIAudioResponse = await fetch('https://api.openai.com/v1/audio/speech', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: 'tts-1', // Or 'tts-1-hd' for higher quality
                                input: word,    // The word itself (OpenAI TTS works with plain text)
                                voice: 'alloy'  // Choose a voice, e.g., 'alloy', 'nova', 'shimmer', 'fable', 'onyx', 'echo'
                            })
                        });

                        if (!openAIAudioResponse.ok) {
                            const errorText = await openAIAudioResponse.text();
                            console.error(`OpenAI TTS Error: Status ${openAIAudioResponse.status}`, errorText);
                            audioBuffer = null; // Ensure no audio plays if TTS fails
                        } else {
                            audioBuffer = await openAIAudioResponse.arrayBuffer(); // Get audio as ArrayBuffer
                            console.log("OpenAI TTS Audio fetched successfully.");
                        }
                    } catch (ttsError) {
                        console.error('Error fetching audio from OpenAI TTS:', ttsError);
                        audioBuffer = null;
                    }
                }

                // --- Step 3: Play audio ---
                if (audioBuffer && pronunciationIconContainer) {
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    audioContext.decodeAudioData(audioBuffer, (buffer) => {
                        // The decoded audio buffer can be reused.
                        // The source node must be created each time the sound is played.
                        const playSound = () => {
                            const source = audioContext.createBufferSource();
                            source.buffer = buffer;
                            source.connect(audioContext.destination);
                            source.start(0);
                        };

                        pronunciationIconContainer.style.cursor = 'pointer';
                        if (audioIcon) {
                            audioIcon.onclick = playSound;
                        } else {
                            pronunciationIconContainer.onclick = playSound;
                        }
                    }, (error) => {
                        console.error("Error decoding audio data:", error);
                        pronunciationIconContainer.style.display = 'none'; // Hide if audio fails
                    });
                } else if (pronunciationIconContainer) {
                    pronunciationIconContainer.style.display = 'none'; // Hide if no audio or key
                }

            } else {
                wordElement.innerHTML = `Word not available <span class="pronunciation-icon"><i class="fas fa-volume-up"></i></span>`;
                definitionElement.textContent = 'Try again later.';
            }

        } catch (error) {
            console.error('Could not fetch word of the day:', error);
            wordElement.innerHTML = `Error <span class="pronunciation-icon"><i class="fas fa-volume-up"></i></span>`;
            definitionElement.textContent = 'Please check your internet connection or API keys.';
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