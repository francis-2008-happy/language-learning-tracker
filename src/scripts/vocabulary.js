// At the very top of scripts/vocabulary.js
import { OPENAI_API_KEY } from './config.js'; // Assuming config.js is in the same 'scripts' directory

// ... rest of your vocabulary.js code (consts, lets, functions)

// ===============================================
// Vocabulary Section (script.js)
// ===============================================

// DOM Elements
const vocabularySection = document.getElementById('vocabularySection');
const langButtons = document.querySelectorAll('.lang-button');
const vocabularyCard = document.querySelector('.vocabulary-card');
const currentWordDisplay = document.getElementById('currentWord');
const wordDefinitionDisplay = document.getElementById('wordDefinition');
const wordExampleDisplay = document.getElementById('wordExample');
const playAudioButton = document.getElementById('playAudio');
const translatedWordDisplay = document.getElementById('translatedWord');
const translatedDefinitionDisplay = document.getElementById('translatedDefinition');
const translatedExampleDisplay = document.getElementById('translatedExample');
const prevWordButton = document.getElementById('prevWord');
const nextWordButton = document.getElementById('nextWord');
const vocabCardContainer = document.querySelector('.vocabulary-card-container'); // For animation

// Variables to hold the fetched data and current state
let vocabularyData = {}; // Will be populated after fetching JSON
let currentLanguage = 'english';
let currentWordIndex = 0;
let isCardFlipped = false;

// Function to fetch vocabulary data from JSON file
export async function fetchVocabularyData() {
    try {
        const response = await fetch('/vocabularyData.json'); // Adjust path if necessary
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        vocabularyData = await response.json();
        console.log("Vocabulary data loaded successfully:", vocabularyData);

        // After data is loaded, display the first word and enable controls
        displayWord(currentLanguage, currentWordIndex);
        setupEventListeners(); // Setup listeners after data is ready
        updateNavigationButtons();

    } catch (error) {
        console.error("Could not fetch vocabulary data:", error);
        // Display an error message to the user
        currentWordDisplay.textContent = "Error loading vocabulary.";
        wordDefinitionDisplay.textContent = "Please try again later.";
        wordExampleDisplay.textContent = "";
        playAudioButton.style.display = 'none';
        nextWordButton.disabled = true;
        prevWordButton.disabled = true;
        // Optionally, hide the entire vocabulary section or card
        if (vocabularyCard) vocabularyCard.style.display = 'none';
    }
}

// Function to display a vocabulary word
function displayWord(lang, index) {
    // Only proceed if data is loaded
    if (Object.keys(vocabularyData).length === 0) {
        console.log("Vocabulary data not yet loaded.");
        return;
    }

    // Remove animation class before updating content to re-trigger it
    vocabCardContainer.classList.remove('animate-in');
    vocabularyCard.classList.remove('flipped'); // Ensure card is front-facing when new word loads
    isCardFlipped = false;

    const words = vocabularyData[lang];
    if (!words || words.length === 0) {
        currentWordDisplay.textContent = "No vocabulary available.";
        wordDefinitionDisplay.textContent = "";
        wordExampleDisplay.textContent = "";
        playAudioButton.style.display = 'none'; // Hide audio button
        translatedWordDisplay.textContent = "";
        translatedDefinitionDisplay.textContent = "";
        translatedExampleDisplay.textContent = "";
        nextWordButton.disabled = true;
        prevWordButton.disabled = true;
        return;
    }

    const wordData = words[index];

    currentWordDisplay.textContent = wordData.word;
    wordDefinitionDisplay.textContent = wordData.definition;
    wordExampleDisplay.textContent = `Example: "${wordData.example}"`;

    // if (wordData.audioUrl) {
    //     playAudioButton.style.display = 'flex'; // Show audio button
    //     playAudioButton.onclick = () => {
    //         const audio = new Audio(wordData.audioUrl);
    //         audio.play().catch(e => console.error("Error playing audio:", e));
    //     };
    // } else {
    //     playAudioButton.style.display = 'none';
    // }

        if (playAudioButton) { // Ensure the button exists
        playAudioButton.style.display = 'flex'; // Always show button if TTS is available
        playAudioButton.onclick = () => {
            // We'll pronounce the main word (currentWordDisplay.textContent)
            // You can choose a different voice if you prefer: 'nova', 'fable', 'onyx', 'shimmer', 'echo'
            playTextToSpeech(currentWordDisplay.textContent, 'nova'); // Using 'nova' voice as an example
        };
    } else {
        console.warn("Audio button element not found!");
    }

    // Set translation content for the back of the card
    const targetLang = getOppositeLanguageKey(lang); // Get a translation for the back
    const translation = wordData.translations[targetLang];

    if (translation) {
        translatedWordDisplay.textContent = translation.word;
        translatedDefinitionDisplay.textContent = translation.definition;
        translatedExampleDisplay.textContent = `Example: "${translation.example}"`;
    } else {
        translatedWordDisplay.textContent = "Translation N/A";
        translatedDefinitionDisplay.textContent = "Translation not available for this language pair.";
        translatedExampleDisplay.textContent = "";
    }

    // Trigger animation after content update
    setTimeout(() => {
        vocabCardContainer.classList.add('animate-in');
    }, 50); // Small delay to allow removal and re-addition to trigger animation
}

// Helper to get a different language for translation on the back of the card
function getOppositeLanguageKey(currentLang) {
    const langs = ['english', 'french', 'spanish', 'korean'];
    const otherLangs = langs.filter(l => l !== currentLang);
    // Just pick the first available other language for the back of the card
    return otherLangs.length > 0 ? otherLangs[0] : currentLang;
}

// Function to update navigation button states
function updateNavigationButtons() {
    // Only update if data is loaded
    if (Object.keys(vocabularyData).length === 0) {
        prevWordButton.disabled = true;
        nextWordButton.disabled = true;
        return;
    }
    const words = vocabularyData[currentLanguage];
    prevWordButton.disabled = currentWordIndex === 0;
    nextWordButton.disabled = currentWordIndex >= words.length - 1;
}

// Centralized function to set up all event listeners
// This ensures listeners are only set up AFTER data is loaded
function setupEventListeners() {
    // Language selection
    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            langButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            currentLanguage = button.dataset.lang;
            currentWordIndex = 0; // Reset to first word for new language
            displayWord(currentLanguage, currentWordIndex);
            updateNavigationButtons();
        });
    });

    // Card flip on click
    vocabularyCard.addEventListener('click', () => {
        vocabularyCard.classList.toggle('flipped');
        isCardFlipped = !isCardFlipped;

    //     // Adjust display of card-front/back based on flip state for accessibility/initial load
    //     const cardFront = vocabularyCard.querySelector('.card-front');
    //     const cardBack = vocabularyCard.querySelector('.card-back');

    //     if (isCardFlipped) {
    //         // Use a short timeout to allow CSS transition to start before changing display
    //         setTimeout(() => {
    //             cardFront.style.display = 'none';
    //             cardBack.style.display = 'flex';
    //         }, 300); // Half of transition duration
    //     } else {
    //         cardFront.style.display = 'flex';
    //         cardBack.style.display = 'none';
    //     }
    });

    // Navigation buttons
    nextWordButton.addEventListener('click', () => {
        const words = vocabularyData[currentLanguage];
        if (currentWordIndex < words.length - 1) {
            currentWordIndex++;
            displayWord(currentLanguage, currentWordIndex);
        }
        updateNavigationButtons();
    });

    prevWordButton.addEventListener('click', () => {
        if (currentWordIndex > 0) {
            currentWordIndex--;
            displayWord(currentLanguage, currentWordIndex);
        }
        updateNavigationButtons();
    });
}

// Initial load: Fetch data when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Other existing DOMContentLoaded logic...
    // For example, your auth UI or initial home page content.

    // Immediately fetch vocabulary data.
    // The rest of the vocabulary display/listeners will be called within fetchVocabularyData's success.
    fetchVocabularyData();

    // --- Important: How to use your environment variables with Vite ---
    // In your `script.js`, you should now be accessing API keys like this:
    // const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
    // const WORD_OF_DAY_API_KEY = import.meta.env.VITE_WORD_OF_DAY_API_KEY;
    // Make sure you have your .env file set up (VITE_OPENAI_API_KEY=..., VITE_WORD_OF_DAY_API_KEY=...)
    // and that it's in your .gitignore.
    // For the vocabulary data in this example, we are using static data, so API keys are not directly involved.
    // However, if you add dynamic audio or word fetches that require keys, use import.meta.env.
});

// In scripts/vocabulary.js, add this new function:

/**
 * Plays the pronunciation of a given text using OpenAI's Text-to-Speech API.
 * @param {string} text The word or phrase to pronounce.
 * @param {string} voice The OpenAI voice model to use (e.g., 'alloy', 'nova', 'fable', 'onyx', 'shimmer', 'echo').
 * @returns {Promise<void>} A promise that resolves when audio starts playing.
 */
async function playTextToSpeech(text, voice = 'alloy') { // Default voice to 'alloy'
    if (!OPENAI_API_KEY) {
        console.error("OpenAI API key is not configured.");
        alert("Audio playback not available: OpenAI API key missing.");
        return;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'tts-1', // You can also try 'tts-1-hd' for higher quality
                input: text,
                voice: voice,
                response_format: 'mp3' // Request MP3 format
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI TTS API error: ${response.status} - ${errorData.error.message || response.statusText}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
        URL.revokeObjectURL(audioUrl); // Clean up the object URL after playing
    } catch (error) {
        console.error("Error playing text-to-speech:", error);
        alert(`Failed to play audio: ${error.message}. Please check your API key and network connection.`);
    }
}