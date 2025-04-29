 // --- Game Data (identical to the provided version) ---
        let gameData = {
            sourceTypeEmoji: '🎭', sourceName: 'Hamlet', gridSize: { rows: 3, cols: 4 },
            quotes: [
                { id: 1, quoteSolved: false, solution: 'To be or not to be, that is the question.', correctSequence: [2, 1, 4, 6, 5], clues: {
                    2: { text: 'Type of pencil (2,2)', solution: 'To be', solved: false }, 
                    1: { text: 'Either... (2)', solution: 'or', solved: false }, 
                    4: { text: 'Different type of pencil (3,2,2)', solution: 'not to be', solved: false }, 
                    6: { text: 'Not this (4)', solution: 'that', solved: false }, 
                    5: { text: 'If x...., what is the answer? (4,2,7)', solution: 'is the question', solved: false },
                }},
                { id: 2, quoteSolved: false, solution: 'Alas, poor Yorick.', correctSequence: [7, 8, 3], clues: {
                    7: { text: 'Sigh (4)', solution: 'Alas', solved: false }, 
                    8: { text: 'Opposite of rich (4)', solution: 'poor', solved: false }, 
                    3: { text: 'Ickory anag. (6)', solution: 'Yorick', solved: false },
                }},
                { id: 3, quoteSolved: false, solution: 'A fellow of infinite jest.', correctSequence: [10, 9, 12, 11], clues: {
                    10: { text: 'tenured professor, Brit. (1, 6)', solution: 'a fellow', solved: false }, 
                    9: { text: 'prep. (2)', solution: 'of', solved: false }, 
                    12: { text: 'lots and lots (8)', solution: 'infinite', solved: false }, 
                    11: { text: 'joke (4)', solution: 'jest', solved: false },
                }}
            ],
            getClueDataByBoxId: function(id) {
                for (const quote of this.quotes) { 
                    if (quote.clues[id]) return quote.clues[id]; 
                } 
                return null;
            },
            getQuoteByBoxId: function(id) {
                for (const quote of this.quotes) { 
                    if (quote.clues[id]) return quote; 
                } 
                return null;
            },
            getAllUnsolvedQuotes: function() {
                return this.quotes.filter(quote => !quote.quoteSolved);
            },
            getAllSolvedClues: function() {
                const solvedClueIds = [];
                for (const quote of this.quotes) {
                    for (const clueId in quote.clues) {
                        if (quote.clues[clueId].solved && !quote.quoteSolved) {
                            solvedClueIds.push(parseInt(clueId));
                        }
                    }
                }
                return solvedClueIds;
            }
        };

        // --- Game State ---
        let currentSelection = [];
        let solvedQuotesCount = 0;
        let totalQuotes = 0;
        let currentPuzzleId = getQueryParam('puzzle') || getTodaysPuzzleId();

        // --- DOM Elements ---
        const sourceEmojiEl = document.getElementById('source-emoji');
        const clueGridEl = document.getElementById('clue-grid');
        const messageAreaEl = document.getElementById('message-area');
        const solvedQuotesAreaEl = document.getElementById('solved-quotes-area');
        const bonusRoundEl = document.getElementById('bonus-round');
        const bonusGuessInput = document.getElementById('bonus-guess');
        const submitBonusButton = document.getElementById('submit-bonus');
        const bonusResultEl = document.getElementById('bonus-result');
        const clearSelectionBtn = document.getElementById('clear-selection');
        const checkSequenceBtn = document.getElementById('check-sequence');
        const currentSequenceEl = document.getElementById('current-sequence');
        // --- Functions ---

/**
 * Get URL query parameter by name
 */
function getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}
/**
 * Get today's puzzle ID based on the ISO 8601 date format
 */
function getTodaysPuzzleId() {
    const today = new Date().toISOString().split('T')[0]; // Format as YYYY-MM-DD
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        hash = ((hash << 5) - hash) + today.charCodeAt(i);
        hash |= 0; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(); // Return hashed ID
}

/**
 * Load puzzle data and find today's puzzle
 */
async function loadPuzzleData() {
    try {
        displayMessage('Loading puzzle...', 'text-blue-600');
        
        // Fetch the puzzles.json file
        const response = await fetch('puzzles.json');
        if (!response.ok) {
            throw new Error('Failed to load puzzles data');
        }

        const puzzlesData = await response.json();
        if (!Array.isArray(puzzlesData) || puzzlesData.length === 0) {
            throw new Error('Puzzles data is undefined or malformed');
        }

        // Get today's date in ISO 8601 format (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];

        // Find the puzzle with a matching dateMatch
        let selectedPuzzle = puzzlesData.find(puzzle => {
            const puzzleDate = puzzle.dateMatch ? puzzle.dateMatch.split('T')[0] : null;
            return puzzleDate === today;
        });

        // Fallback: Use the first puzzle in the list (sorted by "order")
        if (!selectedPuzzle) {
            console.warn(`No puzzle found for today's date (${today}). Falling back to the first puzzle.`);
            selectedPuzzle = puzzlesData.sort((a, b) => (a.order || 0) - (b.order || 0))[0];
        }

        // If no puzzle is available at all, throw an error
        if (!selectedPuzzle) {
            throw new Error('No puzzles available in the dataset.');
        }

        // Update game data with the selected puzzle
        gameData = {
            ...selectedPuzzle,
            getClueDataByBoxId: function (id) {
                for (const quote of this.quotes) {
                    if (quote.clues[id]) {
                        if (quote.clues[id].solved === undefined) {
                            quote.clues[id].solved = false;
                        }
                        return quote.clues[id];
                    }
                }
                return null;
            },
            getQuoteByBoxId: function (id) {
                for (const quote of this.quotes) {
                    if (quote.clues[id]) {
                        if (quote.quoteSolved === undefined) {
                            quote.quoteSolved = false;
                        }
                        return quote;
                    }
                }
                return null;
            },
            getAllUnsolvedQuotes: function () {
                return this.quotes.filter(quote => !quote.quoteSolved);
            },
            getAllSolvedClues: function () {
                const solvedClueIds = [];
                for (const quote of this.quotes) {
                    for (const clueId in quote.clues) {
                        if (quote.clues[clueId].solved && !quote.quoteSolved) {
                            solvedClueIds.push(parseInt(clueId));
                        }
                    }
                }
                return solvedClueIds;
            }
        };

        totalQuotes = gameData.quotes.length;
        initGame();
        clearMessage();
    } catch (error) {
        console.error('Error loading puzzle data:', error);
        displayMessage('Error loading puzzle data. Please try again later.', 'text-red-600');
    }
}
        /**
 * Initializes the game board.
 */
function initGame() {
    // Clear existing content
    clueGridEl.innerHTML = '';
    solvedQuotesAreaEl.innerHTML = '';
    currentSequenceEl.textContent = "Select solved clues to form a quote";
    
    // Set header content
    sourceEmojiEl.textContent = gameData.sourceTypeEmoji;
    document.title = `Quotable`;
    
    const totalBoxes = gameData.gridSize.rows * gameData.gridSize.cols;
    for (let i = 1; i <= totalBoxes; i++) {
        const clueData = gameData.getClueDataByBoxId(i);
        const container = document.createElement('div');
        container.classList.add('clue-box-container');
        container.dataset.boxId = i;
        const inner = document.createElement('div');
        inner.classList.add('clue-box-inner');
        const front = document.createElement('div');
        front.classList.add('clue-box-front');
        const back = document.createElement('div');
        back.classList.add('clue-box-back');
        if (clueData) {
            front.textContent = clueData.text;
            const input = document.createElement('input');
            input.type = 'text'; 
            input.placeholder = 'Your answer...';
            input.addEventListener('keydown', (e) => { 
                if (e.key === 'Enter') { 
                    handleClueSubmit(i); 
                } 
                input.classList.remove('input-error'); 
            });
            const button = document.createElement('button');
            button.textContent = 'Submit'; 
            button.addEventListener('click', () => handleClueSubmit(i));
            back.appendChild(input); 
            back.appendChild(button);
            container.addEventListener('click', handleBoxClick);
        } else {
            front.textContent = ''; 
            container.classList.add('empty-box');
        }
        inner.appendChild(front);
        if (clueData) inner.appendChild(back);
        container.appendChild(inner);
        clueGridEl.appendChild(container);
    }
    
    // Add event listeners for sequence control buttons
    clearSelectionBtn.addEventListener('click', clearSelection);
    checkSequenceBtn.addEventListener('click', manualCheckSequence);
    submitBonusButton.addEventListener('click', handleBonusSubmit);
    
    // Reset game state
    currentSelection = [];
    solvedQuotesCount = 0;
    updateControlsState();
    
    // Hide bonus round section
    bonusRoundEl.classList.add('hidden');
    bonusRoundEl.classList.remove('block');
    bonusGuessInput.value = '';
    bonusGuessInput.disabled = false;
    submitBonusButton.disabled = false;
    submitBonusButton.classList.remove('opacity-50', 'cursor-not-allowed');
    bonusResultEl.textContent = '';
}

/**
 * Updates the control buttons state based on current selection
 */
function updateControlsState() {
    // Enable/disable clear selection button
    clearSelectionBtn.disabled = currentSelection.length === 0;
    
    // Enable/disable check sequence button
    checkSequenceBtn.disabled = currentSelection.length < 2;
    
    // Update the current sequence display
    updateSequenceDisplay();
}

/**
 * Updates the display of the current sequence
 */
function updateSequenceDisplay() {
    if (currentSelection.length === 0) {
        currentSequenceEl.textContent = "Select solved clues to form a quote";
        return;
    }

    const words = currentSelection.map(boxId => {
        const clueData = gameData.getClueDataByBoxId(boxId);
        return clueData.solution;
    });
    
    currentSequenceEl.textContent = `Current sequence: "${words.join(' ')}"`;
}

/**
 * Handles clicking on a clue box container.
 */
function handleBoxClick(event) {
    const container = event.currentTarget;
    const boxId = parseInt(container.dataset.boxId);
    const clueData = gameData.getClueDataByBoxId(boxId);
    const quoteData = gameData.getQuoteByBoxId(boxId);

    // Ignore clicks on empty or fully solved boxes
    if (!clueData || (quoteData && quoteData.quoteSolved)) {
        return;
    }

    // If the box is already flipped (showing input)...
    if (container.classList.contains('is-flipped')) {
        // Check if the click target is the input or button itself
        // If so, let their specific event handlers work (or do nothing for the container click)
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'BUTTON') {
            return;
        }
        // Otherwise, flip it back to show the clue
        container.classList.remove('is-flipped');
        clearMessage(); // Clear any potential error messages from failed submits
        return; // Stop further processing for this click
    }

    // --- If the box is NOT flipped ---

    if (clueData.solved) {
        // --- Word Revealed State: Handle sequence selection ---
        toggleClueSelection(container, boxId);
    } else {
        // --- Unsolved State: Flip to Input ---
        container.classList.add('is-flipped');
        const input = container.querySelector('.clue-box-back input');
        if(input) input.focus();
        clearMessage(); // Clear any previous messages
    }
}

/**
 * Toggles the selection state of a clue for sequence building
 */
function toggleClueSelection(container, boxId) {
    // If already selected, remove from selection
    if (container.classList.contains('selected')) {
        container.classList.remove('selected');
        // Remove any sequence counter
        const counter = container.querySelector('.sequence-counter');
        if (counter) counter.remove();
        // Remove from selection array
        currentSelection = currentSelection.filter(id => id !== boxId);
    } else {
        // Otherwise add to selection
        container.classList.add('selected');
        // Add sequence counter
        const position = currentSelection.length + 1;
        const counter = document.createElement('div');
        counter.classList.add('sequence-counter');
        counter.textContent = position;
        container.appendChild(counter);
        // Add to selection array
        currentSelection.push(boxId);
    }
    
    clearMessage();
    updateControlsState();
}

/**
 * Clears all current selections
 */
function clearSelection() {
    currentSelection.forEach(boxId => {
        const container = clueGridEl.querySelector(`.clue-box-container[data-box-id='${boxId}']`);
        if (container) {
            container.classList.remove('selected');
            const counter = container.querySelector('.sequence-counter');
            if (counter) counter.remove();
        }
    });
    
    currentSelection = [];
    clearMessage();
    updateControlsState();
}

/**
 * Manually checks the current sequence when button is clicked
 */
function manualCheckSequence() {
    if (currentSelection.length < 2) {
        displayMessage('Select more clues to form a quote', 'text-yellow-600');
        return;
    }
    
    checkSequenceSelection();
}

/**
 * Handles the submission of an individual clue guess.
 */
function handleClueSubmit(boxId) {
    const container = clueGridEl.querySelector(`.clue-box-container[data-box-id='${boxId}']`);
    const input = container.querySelector('.clue-box-back input');
    const front = container.querySelector('.clue-box-front');
    const clueData = gameData.getClueDataByBoxId(boxId);
    const guess = input.value.trim(); // Trim user input
    
    if (!clueData || !guess) return;
    
    // Compare trimmed and case-normalized strings
    if (guess.toLowerCase() === clueData.solution.trim().toLowerCase()) {
        clueData.solved = true;
        front.textContent = clueData.solution;
        container.classList.add('word-revealed');
        container.classList.remove('is-flipped');
        input.value = '';
        input.classList.remove('input-error');
        displayMessage('Correct! Now you can use this word in a quote sequence.', 'text-green-600');
    } else {
        input.classList.add('input-error');
        displayMessage('Incorrect clue answer.', 'text-orange-600');
        container.querySelector('.clue-box-inner').classList.add('shake');
        setTimeout(() => { container.querySelector('.clue-box-inner').classList.remove('shake'); }, 500);
    }
}

/**
 * Checks if the current sequence selection matches any quote.
 */
function checkSequenceSelection() {
    if (currentSelection.length === 0) {
        return;
    }
    
    let perfectMatch = false;
    let matchedQuote = null;

    for (const quote of gameData.quotes) {
        if (quote.quoteSolved) continue;

        // Get the solved clue IDs for the current quote
        const solvedClueIds = Object.keys(quote.clues)
            .filter(clueId => quote.clues[clueId].solved)
            .map(id => parseInt(id));

        // Ensure all clues in the correctSequence are solved
        const allCluesSolved = quote.correctSequence.every(id => solvedClueIds.includes(id));
        if (!allCluesSolved) continue;

        // Ensure the current selection matches the entire correctSequence
        if (isValidQuoteSequence(currentSelection, quote.correctSequence) &&
            currentSelection.length === quote.correctSequence.length) {
            perfectMatch = true;
            matchedQuote = quote;
            break;
        }
    }

    if (perfectMatch && matchedQuote) {
        handleCorrectSequence(matchedQuote);
    } else {
        handleIncorrectSequence();
    }
}

/**
 * Checks if a selection is a valid sequence for a quote
 */
function isValidQuoteSequence(selection, correctSequence) {
    // First check if all selected clues are part of the correct sequence
    const allFromSameQuote = selection.every(id => correctSequence.includes(id));
    if (!allFromSameQuote) return false;
    
    // Now check if the sequence is in correct order
    // Extract the subsequence from the correct sequence based on our selection
    const subSequence = [];
    for (const id of correctSequence) {
        if (selection.includes(id)) {
            subSequence.push(id);
        }
    }
    
    // Check if our selection matches this subsequence
    return arrayEquals(selection, subSequence);
}

/**
 * Helper function to compare two arrays
 */
function arrayEquals(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * Handles a correctly identified quote sequence.
 */
function handleCorrectSequence(quote) {
    quote.quoteSolved = true; 
    solvedQuotesCount++;
    
    displayMessage(`Correct! Quote ${quote.id} solved.`, 'text-green-600');
    
    quote.correctSequence.forEach(boxId => {
        const container = clueGridEl.querySelector(`.clue-box-container[data-box-id='${boxId}']`);
        if (container) { 
            container.classList.remove('selected', 'word-revealed'); 
            container.classList.add('quote-solved');
            // Remove any sequence counter
            const counter = container.querySelector('.sequence-counter');
            if (counter) counter.remove();
        }
    });
    
    const quoteDisplay = document.createElement('div');
    quoteDisplay.classList.add('p-3', 'bg-green-100', 'border', 'border-green-300', 'rounded-md', 'text-green-800', 'text-center');
    quoteDisplay.textContent = `"${quote.solution}"`;
    solvedQuotesAreaEl.appendChild(quoteDisplay);
    
    currentSelection = [];
    updateControlsState();
    
    // Run the enhanced animation
    enhancedCorrectSequenceAnimation(quote);
    
    if (solvedQuotesCount === totalQuotes) { 
        handleAllQuotesSolved(); 
    }
}
/**
 * Handles an incorrect selection sequence.
 */
function handleIncorrectSequence() {
    displayMessage('Incorrect sequence. Try again.', 'text-red-600');
    
    const selectedContainers = [];
    currentSelection.forEach(boxId => {
        const container = clueGridEl.querySelector(`.clue-box-container[data-box-id='${boxId}']`);
        if (container) { 
            selectedContainers.push(container); 
            container.querySelector('.clue-box-inner').classList.add('shake'); 
        }
    });
    
    setTimeout(() => {
        selectedContainers.forEach(container => { 
            container.querySelector('.clue-box-inner').classList.remove('shake');
        });
        // We don't clear the selection automatically anymore
    }, 500);
}

// --- Bonus Round and Message Functions ---
function handleAllQuotesSolved() { 
    displayMessage('Congratulations! All quotes found!', 'text-blue-600'); 
    bonusRoundEl.classList.remove('hidden'); 
    bonusRoundEl.classList.add('block'); 
    
    // Add pulse animation to the submit button
    submitBonusButton.classList.add('pulse-button');
    
    clearSelectionBtn.disabled = true;
    checkSequenceBtn.disabled = true;
    
    // Enhanced message animation
    messageAreaEl.classList.add('message-flash');
    setTimeout(() => {
        messageAreaEl.classList.remove('message-flash');
    }, 600);
}

function handleBonusSubmit() { 
    const guess = bonusGuessInput.value.trim().toLowerCase(); 
    const correctAnswer = gameData.sourceName.toLowerCase(); 
    const isCorrect = guess === correctAnswer;
    
    if (isCorrect) { 
        bonusResultEl.textContent = 'Correct! Well done!'; 
        bonusResultEl.className = 'mt-3 h-6 font-medium text-green-600'; 
    } else { 
        bonusResultEl.textContent = `Incorrect. The source was: ${gameData.sourceName}`; 
        bonusResultEl.className = 'mt-3 h-6 font-medium text-red-600'; 
    } 
    
    bonusGuessInput.disabled = true; 
    submitBonusButton.disabled = true; 
    submitBonusButton.classList.add('opacity-50', 'cursor-not-allowed'); 
    
    // Run the enhanced animation
    enhancedBonusCompletionAnimation(isCorrect);
}

function displayMessage(text, colorClass) { 
    messageAreaEl.textContent = text; 
    messageAreaEl.className = 'h-8 mb-4 text-center font-medium'; 
    messageAreaEl.classList.add(colorClass); 
}

function clearMessage() { 
    messageAreaEl.textContent = ''; 
}

function createConfettiEffect() {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
    const confettiCount = 100;
    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = `${Math.random() * 10 + 5}px`;
        confetti.style.opacity = Math.random().toString();
        confetti.style.animation = `confettiFall ${Math.random() * 3 + 2}s ease-out forwards`;
        
        // Rotate the confetti pieces randomly
        const rotation = Math.random() * 360;
        confetti.style.transform = `rotate(${rotation}deg)`;
        
        container.appendChild(confetti);
    }
    
    // Remove the confetti container after animation completes
    setTimeout(() => {
        container.remove();
    }, 5000);
}
/**
 * Enhanced bonus round completion animation
 * @param {boolean} isCorrect - Whether the answer was correct
 */
function enhancedCorrectSequenceAnimation(quote) {
    // Create a subtle glow effect for all solved clue boxes
    quote.correctSequence.forEach(boxId => {
        const container = document.querySelector(`.clue-box-container[data-box-id='${boxId}']`);
        if (container) {
            container.classList.add('quote-solved-animation');
            // Remove the animation class after it completes
            setTimeout(() => {
                container.classList.remove('quote-solved-animation');
            }, 1200);
        }
    });
    
    // Add confetti effect
    createConfettiEffect();
    
    // Animate the quote display that appears in the solved quotes area
    const quoteDisplay = solvedQuotesAreaEl.lastElementChild;
    if (quoteDisplay) {
        quoteDisplay.classList.add('quote-solved-animation');
        // Remove the animation class after it completes
        setTimeout(() => {
            quoteDisplay.classList.remove('quote-solved-animation');
        }, 1200);
    }
    
    // Add message flash animation
    if (messageAreaEl) {
        messageAreaEl.classList.add('message-flash');
        setTimeout(() => {
            messageAreaEl.classList.remove('message-flash');
        }, 600);
    }
}

// --- Bonus Round Success Animation ---

/**
 * Creates a trophy icon animation when the bonus round is completed
 */
function createTrophyAnimation() {
    // Create trophy element
    const trophyContainer = document.createElement('div');
    trophyContainer.className = 'text-center';
    
    const trophy = document.createElement('div');
    trophy.className = 'trophy-icon';
    trophy.innerHTML = '🏆';
    
    trophyContainer.appendChild(trophy);
    
    // Insert trophy before bonus result
    const bonusResult = document.getElementById('bonus-result');
    bonusResult.parentNode.insertBefore(trophyContainer, bonusResult);
    
    // Add animation class after a small delay to ensure the DOM is updated
    setTimeout(() => {
        trophy.classList.add('trophy-animation');
    }, 100);
}

/**
 * Enhanced bonus round completion animation
 * @param {boolean} isCorrect - Whether the answer was correct
 */
function enhancedBonusCompletionAnimation(isCorrect) {
    // Animate the bonus round container
    bonusRoundEl.classList.add('game-completed-animation');
    
    // Remove animation class after it completes
    setTimeout(() => {
        bonusRoundEl.classList.remove('game-completed-animation');
    }, 1500);
    
    // Add trophy animation only if the answer was correct
    if (isCorrect) {
        createTrophyAnimation();
        
        // Create full-screen celebratory effect
        createConfettiEffect();
    }
    
    // Add message flash animation
    if (bonusResultEl) {
        bonusResultEl.classList.add('message-flash');
        setTimeout(() => {
            bonusResultEl.classList.remove('message-flash');
        }, 600);
    }
}

// --- Integration with Existing Functions ---

document.addEventListener('DOMContentLoaded', () => {
    const helpButton = document.getElementById('help-button');
    const helpModal = document.getElementById('help-modal');
    const closeHelpModal = document.getElementById('close-help-modal');

    // Show the help modal
    helpButton.addEventListener('click', () => {
        helpModal.classList.remove('hidden');
    });

    // Close the help modal
    closeHelpModal.addEventListener('click', () => {
        helpModal.classList.add('hidden');
    });

    // Close the help modal when clicking outside of it
    helpModal.addEventListener('click', (event) => {
        if (event.target === helpModal) {
            helpModal.classList.add('hidden');
        }
    });

 // Dynamically render the list of clue types
    const clueTypes = ['All antonyms', 'All synonyms', 'Quick Crossword style', 'Anagrams', 'Cryptic', 'or a mixture of all these!'];
    const clueList = document.getElementById('clue-list'); // Ensure this element exists in the HTML
    clueTypes.forEach(type => {
        const listItem = document.createElement('li');
        listItem.textContent = type;
        clueList.appendChild(listItem);
    });
});
        
// --- Initialize Game ---
document.addEventListener('DOMContentLoaded', loadPuzzleData);
