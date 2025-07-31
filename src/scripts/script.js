import { WORDSAPI_KEY, OPENAI_API_KEY } from './config.js';
import { fetchVocabularyData } from './vocabulary.js';
import {
  loadQuestions,
  startQuiz,
  nextQuestion,
  restartQuiz,
  quitQuiz
} from './quiz.js';
// import config from "./config.js";


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
        const RAPIDAPI_HOST = 'wordsapiv1.p.rapidapi.com';

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
    

    // Function to update the last updated date/time in the footer
function updateFooterDateTime() {
    const lastUpdatedSpan = document.getElementById('lastUpdatedDateTime');
    if (lastUpdatedSpan) {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true // For AM/PM format
        };
        lastUpdatedSpan.textContent = now.toLocaleString(undefined, options);
    }
}

// --- Event Listeners and Initial Setup (inside DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', () => {

});


// ===============================================
// Testimonials Section
// ===============================================

// Sample Testimonial Data
const testimonialsData = [
    {
        id: 't1',
        name: 'Alice Johnson',
        picture: 'images/testimony1.jpg', // Placeholder image URL
        period: '6 months of Spanish',
        testimony: 'This language tracker has revolutionized my learning process! The daily word feature keeps me consistent, and the quiz mode is incredibly effective for active recall. I\'ve seen significant improvement in my vocabulary retention since I started using it. Highly recommend to anyone serious about language learning!'
    },
    {
        id: 't2',
        name: ' Hazani Williams',
        picture: 'images/testimony2.jpg', 
        period: '1 year of Japanese',
        testimony: 'I struggled with consistency until I found this app. Setting goals and tracking my progress visually has been a game-changer. The cultural facts are a nice touch too, adding context to my studies. It\'s intuitive and genuinely helpful.'
    },
    {
        id: 't3',
        name: 'Ugochukwu Obi',
        picture: 'images/testimony3.jpg', 
        period: '3 months of French',
        testimony: 'The ability to categorize words as "new," "learned," and "mastered" is brilliant. It helps me focus on what I need to review most. Plus, the pronunciation feature with OpenAI\'s TTS is incredibly accurate and a huge help for my speaking practice. Best language tool I\'ve used!'
    },
    {
        id: 't4',
        name: 'Rowland Rukevwe',
        picture: 'images/testimony5.jpg', 
        period: '2 years of German',
        testimony: 'As an advanced learner, I appreciate the flexibility to add my own words and definitions. The quiz customization allows me to target specific areas of weakness. It\'s like having a personalized tutor right in my pocket. The new footer links are also a great addition for further resources!'
    },
    {
        id: 't5',
        name: 'Erubami Godstime',
        picture: 'images/testimony4.jpg', 
        period: '8 months of Korean',
        testimony: 'This tracker is simple, effective, and beautifully designed. The daily cultural facts are a delightful surprise and keep me engaged beyond just vocabulary. I\'ve recommended it to all my language exchange partners. Keep up the great work!'
    },
        {
        id: 't5',
        name: 'Efemena Tobore',
        picture: 'images/testimony6.jpg', 
        period: '8 months of Korean',
        testimony: 'This tracker is simple, effective, and beautifully designed. The daily cultural facts are a delightful surprise and keep me engaged beyond just vocabulary. I\'ve recommended it to all my language exchange partners. Keep up the great work!'
    }

];

const testimonialsContainer = document.querySelector('.testimonials-container');
const noTestimonialsMessage = document.getElementById('noTestimonialsMessage');
const navPrevArrow = document.querySelector('.nav-arrow.prev-arrow');
const navNextArrow = document.querySelector('.nav-arrow.next-arrow');
const testimonialsSection = document.getElementById('testimonialsSection'); // Reference to the section

let currentTestimonialPage = 0;
const testimonialsPerPage = 3; // Number of testimonials to show on desktop

// Function to render testimonials
function renderTestimonials() {
    if (!testimonialsContainer) return; // Exit if container not found

    testimonialsContainer.innerHTML = ''; // Clear existing testimonials

    if (testimonialsData.length === 0) {
        if (noTestimonialsMessage) noTestimonialsMessage.style.display = 'block';
        if (navPrevArrow) navPrevArrow.style.display = 'none';
        if (navNextArrow) navNextArrow.style.display = 'none';
        return;
    } else {
        if (noTestimonialsMessage) noTestimonialsMessage.style.display = 'none';
    }

    // Determine which testimonials to display based on currentTestimonialPage
    // On mobile, show all. On desktop, show a subset for carousel effect.
    let startIndex, endIndex;
    if (window.innerWidth < 768) { // Mobile view, show all
        startIndex = 0;
        endIndex = testimonialsData.length;
        if (navPrevArrow) navPrevArrow.style.display = 'none';
        if (navNextArrow) navNextArrow.style.display = 'none';
    } else { // Desktop view, show paginated
        startIndex = currentTestimonialPage * testimonialsPerPage;
        endIndex = startIndex + testimonialsPerPage;
        if (navPrevArrow) navPrevArrow.style.display = 'flex'; // Use flex to center icon
        if (navNextArrow) navNextArrow.style.display = 'flex'; // Use flex to center icon
    }

    const testimonialsToDisplay = testimonialsData.slice(startIndex, endIndex);

    testimonialsToDisplay.forEach(testimonial => {
        const card = document.createElement('div');
        card.className = 'testimonial-card';
        card.innerHTML = `
            <div class="student-info">
                <img src="${testimonial.picture}" alt="${testimonial.name}" class="student-pic">
                <div class="student-details">
                    <h4 class="student-name">${testimonial.name}</h4>
                    <p class="study-period">${testimonial.period}</p>
                </div>
            </div>
            <p class="testimony-text" data-full-text="${testimonial.testimony}">
                ${testimonial.testimony.substring(0, 150)}... <!-- Initial truncated text -->
                <button class="read-more-btn" data-action="read-more" style="${testimonial.testimony.length > 150 ? '' : 'display:none;'}">Read More</button>
            </p>
        `;
        testimonialsContainer.appendChild(card);
    });

    // Update navigation button states
    updateTestimonialNavigation();
}

// Function to update navigation arrow visibility (desktop only)
function updateTestimonialNavigation() {
    if (window.innerWidth < 768) {
        if (navPrevArrow) navPrevArrow.style.display = 'none';
        if (navNextArrow) navNextArrow.style.display = 'none';
        return;
    }

    if (navPrevArrow) {
        navPrevArrow.disabled = currentTestimonialPage === 0;
    }
    if (navNextArrow) {
        navNextArrow.disabled = (currentTestimonialPage + 1) * testimonialsPerPage >= testimonialsData.length;
    }
}

// Event listener for "Read More" buttons and navigation arrows
if (testimonialsContainer) {
    testimonialsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.read-more-btn');
        if (button) {
            const testimonyTextElement = button.closest('.testimony-text');
            if (testimonyTextElement) {
                const fullText = testimonyTextElement.dataset.fullText;
                if (testimonyTextElement.classList.contains('expanded')) {
                    testimonyTextElement.classList.remove('expanded');
                    testimonyTextElement.innerHTML = `${fullText.substring(0, 150)}... <button class="read-more-btn" data-action="read-more">Read More</button>`;
                } else {
                    testimonyTextElement.classList.add('expanded');
                    testimonyTextElement.innerHTML = `${fullText} <button class="read-more-btn" data-action="read-more">Show Less</button>`;
                }
            }
        }
    });
}

if (navPrevArrow) {
    navPrevArrow.addEventListener('click', () => {
        if (currentTestimonialPage > 0) {
            currentTestimonialPage--;
            renderTestimonials();
        }
    });
}

if (navNextArrow) {
    navNextArrow.addEventListener('click', () => {
        if ((currentTestimonialPage + 1) * testimonialsPerPage < testimonialsData.length) {
            currentTestimonialPage++;
            renderTestimonials();
        }
    });
}

// Re-render testimonials on window resize to switch between mobile/desktop view
window.addEventListener('resize', () => {
    renderTestimonials();
});

// This will ensure testimonials are only visible when logged in.
const originalUpdateAuthUI = updateAuthUI; // Store original function to extend it
updateAuthUI = () => {
    originalUpdateAuthUI(); // Call the original UI update logic
    const loggedInUsername = getCurrentUser();
    
    if (loggedInUsername) {
        if (testimonialsSection) testimonialsSection.style.display = 'block'; // Show testimonials
        renderTestimonials(); // Render them when logged in
    } else {
        if (testimonialsSection) testimonialsSection.style.display = 'none'; // Hide testimonials
    }
};

// --- Initial Calls (ensure these are within DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', () => {

});


// NEW: Helper function to get current user
function getCurrentUser() {
    return localStorage.getItem(CURRENT_USER_STORAGE_KEY);
}


// Initial load for general UI and page-specific modules
document.addEventListener('DOMContentLoaded', () => {
   
    // Check if we are on the vocabulary page and initialize its logic
    const vocabularySection = document.getElementById('vocabularySection');
    if (vocabularySection) {
        // Initialize vocabulary logic by fetching data
        fetchVocabularyData();
    }
    });


    window.addEventListener('DOMContentLoaded', loadQuestions);

// Expose functions for HTML onclick
    window.startQuiz = startQuiz;
    window.nextQuestion = nextQuestion;
    window.restartQuiz = restartQuiz;   
    window.quitQuiz = quitQuiz;

    // --- Initial Page Load Calls ---
    renderTestimonials();
    updateFooterDateTime();
    updateAuthUI();
    fetchWordOfTheDay();
    fetchCulturalFact();
});
