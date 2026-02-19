/* ============================================
   Inclusive Voting App - Voice Assistance
   Web Speech API integration for voice commands and TTS
   ============================================ */

// ============================================
// Speech Recognition Setup
// ============================================

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;
let isAlwaysOn = false;
let currentPage = 'login'; // 'login', 'home', 'voting', 'face-verification'

/**
 * Initialize speech recognition
 * @returns {boolean} Success status
 */
function initSpeechRecognition() {
  if (!SpeechRecognition) {
    console.warn('Speech Recognition not supported in this browser');
    return false;
  }
  
  try {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true; // Always-on mode
    recognition.maxAlternatives = 1;
    
    // Event handlers
    recognition.onstart = () => {
      isListening = true;
      updateVoiceStatus();
      console.log('Speech recognition started');
    };
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join(' ')
        .trim();
      
      console.log('Heard:', transcript);
      console.log('All results:', Array.from(event.results).map(r => r[0].transcript));
      
      // Process the command
      try {
        handleVoiceCommand(transcript);
      } catch (error) {
        console.error('Error handling voice command:', error);
        speak('Sorry, there was an error processing your command. Please try again.');
      }
    };
    
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      
      // Auto-restart on certain errors if always-on is enabled
      if (isAlwaysOn && (event.error === 'no-speech' || event.error === 'aborted')) {
        setTimeout(() => {
          if (isAlwaysOn) {
            try {
              recognition.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 500);
      } else if (event.error === 'not-allowed') {
        speak('Microphone access denied. Please enable microphone permissions.');
        setAlwaysOnMode(false);
      }
    };
    
    recognition.onend = () => {
      isListening = false;
      updateVoiceStatus();
      
      // Auto-restart if always-on mode is enabled
      if (isAlwaysOn) {
        setTimeout(() => {
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
          }
        }, 300);
      }
    };
    
    return true;
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
    return false;
  }
}

// ============================================
// Text-to-Speech
// ============================================

/**
 * Speak text aloud
 * @param {string} text - Text to speak
 * @param {Object} options - Speech options (rate, pitch, volume)
 */
function speak(text, options = {}) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech Synthesis not supported');
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = options.rate || 1.0;
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
  };
  
  window.speechSynthesis.speak(utterance);
}

/**
 * Stop speaking
 */
function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

// ============================================
// Voice Control Functions
// ============================================

/**
 * Start listening for voice commands
 */
function startListening() {
  if (!recognition) {
    if (!initSpeechRecognition()) {
      showVoiceError('Speech recognition is not available in this browser.');
      return false;
    }
  }
  
  try {
    recognition.start();
    isListening = true;
    updateVoiceStatus();
    return true;
  } catch (error) {
    console.error('Error starting recognition:', error);
    return false;
  }
}

/**
 * Stop listening for voice commands
 */
function stopListening() {
  if (recognition && isListening) {
    try {
      recognition.stop();
      isListening = false;
      updateVoiceStatus();
    } catch (error) {
      console.error('Error stopping recognition:', error);
    }
  }
}

/**
 * Toggle always-on listening mode
 * @param {boolean} enabled - Enable or disable always-on mode
 */
function setAlwaysOnMode(enabled) {
  isAlwaysOn = enabled;
  
  if (enabled) {
    startListening();
  } else {
    stopListening();
  }
  
  updateVoiceStatus();
}

/**
 * Toggle voice assistance on/off
 */
function toggleVoiceAssistance() {
  if (isAlwaysOn) {
    setAlwaysOnMode(false);
    speak('Voice assistance turned off.');
  } else {
    setAlwaysOnMode(true);
    speak('Voice assistance turned on. I am listening.');
  }
}

// ============================================
// Voice Status UI
// ============================================

/**
 * Update voice status indicator in UI
 */
function updateVoiceStatus() {
  const statusEl = document.getElementById('voice-status-text');
  const indicatorEl = document.getElementById('voice-indicator');
  const btnEl = document.getElementById('btn-voice-toggle');
  
  if (statusEl) {
    if (isAlwaysOn && isListening) {
      statusEl.textContent = 'Voice: Listening (Always On)';
      statusEl.setAttribute('aria-label', 'Voice assistance is active and listening');
    } else if (isAlwaysOn) {
      statusEl.textContent = 'Voice: Starting...';
    } else {
      statusEl.textContent = 'Voice: Off';
      statusEl.setAttribute('aria-label', 'Voice assistance is off');
    }
  }
  
  if (indicatorEl) {
    if (isAlwaysOn && isListening) {
      indicatorEl.classList.add('listening');
    } else {
      indicatorEl.classList.remove('listening');
    }
  }
  
  if (btnEl) {
    btnEl.setAttribute('aria-pressed', isAlwaysOn ? 'true' : 'false');
    btnEl.title = isAlwaysOn ? 'Turn off voice assistance' : 'Turn on voice assistance';
  }
}

/**
 * Show voice error message
 * @param {string} message - Error message
 */
function showVoiceError(message) {
  console.error('Voice Error:', message);
  if (typeof showStatusMessage === 'function') {
    showStatusMessage(message, 'error');
  }
}

// ============================================
// Voice Command Handling
// ============================================

/**
 * Normalize command text for matching
 * @param {string} text - Command text
 * @returns {string} Normalized text
 */
function normalizeCommand(text) {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

/**
 * Handle voice command based on current page
 * @param {string} command - Voice command text
 */
function handleVoiceCommand(command) {
  const normalized = normalizeCommand(command);
  console.log('Processing command:', normalized, 'Current page:', currentPage);
  
  // Try to handle voting commands first (they work on voting page)
  // Check if we're on voting page by looking for voting-specific elements
  const verifyBtn = document.getElementById('btn-verify-face');
  const votingSection = document.getElementById('voting-section');
  const candidatesContainer = document.getElementById('candidates-container');
  
  if (verifyBtn || votingSection || candidatesContainer) {
    // We're on voting page, handle voting commands
    handleVotingCommands(normalized);
    return;
  }
  
  // Otherwise, use page context
  switch (currentPage) {
    case 'login':
      handleLoginCommands(normalized);
      break;
    case 'home':
      handleHomeCommands(normalized);
      break;
    case 'voting':
      handleVotingCommands(normalized);
      break;
    case 'face-verification':
      handleFaceVerificationCommands(normalized);
      break;
    default:
      console.log('Unknown page context:', currentPage, '- trying voting commands as fallback');
      // Fallback: try voting commands if elements exist
      if (verifyBtn || votingSection) {
        handleVotingCommands(normalized);
      }
  }
}

/**
 * Handle voice commands on login page
 * @param {string} command - Normalized command
 */
function handleLoginCommands(command) {
  if (command.includes('login') || command.includes('log in')) {
    const loginBtn = document.getElementById('btn-login');
    if (loginBtn) {
      speak('Logging in...');
      loginBtn.click();
    }
  } else if (command.includes('clear')) {
    const aadharInput = document.getElementById('aadhar-input');
    const passwordInput = document.getElementById('password-input');
    if (aadharInput) aadharInput.value = '';
    if (passwordInput) passwordInput.value = '';
    speak('Form cleared.');
  } else if (command.includes('back')) {
    speak('You are on the login page.');
  } else {
    speak('Say "Login" to proceed, or "Clear" to clear the form.');
  }
}

/**
 * Handle voice commands on home page
 * @param {string} command - Normalized command
 */
function handleHomeCommands(command) {
  if (command.includes('voting page') || command.includes('vote now') || command.includes('go to voting')) {
    const voteLink = document.querySelector('a[href="voting.html"]');
    if (voteLink) {
      speak('Navigating to voting page...');
      voteLink.click();
    } else {
      if (typeof redirectTo === 'function') {
        redirectTo('voting.html');
      }
    }
  } else if (command.includes('read rules') || command.includes('rules')) {
    readPageContent();
  } else if (command.includes('log out') || command.includes('logout')) {
    handleLogoutCommand();
  } else if (command.includes('profile') || command.includes('open profile')) {
    const profileBtn = document.getElementById('btn-profile');
    if (profileBtn) {
      profileBtn.click();
    }
  } else if (command.includes('home')) {
    speak('You are already on the home page.');
  } else {
    speak('Say "Go to voting page", "Read rules", "Open profile", or "Log out".');
  }
}

/**
 * Handle voice commands on voting page
 * @param {string} command - Normalized command
 */
function handleVotingCommands(command) {
  console.log('Handling voting command:', command);
  
  // Check for verify identity command (for pre-vote verification)
  if (command.includes('verify identity') || command.includes('verify') || command.includes('start verification') || command.includes('begin verification')) {
    const verifyBtn = document.getElementById('btn-verify-face');
    const verifySection = document.getElementById('face-verify-section');
    
    // Check if verify button exists (regardless of section visibility)
    if (verifyBtn) {
      // Check if section is visible or if button exists in DOM
      const isSectionVisible = !verifySection || verifySection.style.display !== 'none';
      
      if (isSectionVisible && !verifyBtn.disabled) {
        console.log('Triggering verify button click');
        speak('Starting identity verification...');
        verifyBtn.click();
        return;
      } else if (verifyBtn.disabled) {
        speak('Verification is already in progress. Please wait.');
        return;
      } else {
        console.log('Verify section not visible, but button exists');
        // Try clicking anyway - might work
        speak('Starting identity verification...');
        verifyBtn.click();
        return;
      }
    } else {
      console.log('Verify button not found');
      speak('Verify button not found. Please refresh the page.');
      return;
    }
  }

  // Check for confirm vote (in modal) - try multiple selectors
  if (command.includes('confirm') || command.includes('yes') || command.includes('confirm vote')) {
    console.log('Looking for confirm button in modal');
    let confirmBtn = document.getElementById('modal-confirm-btn');
    if (!confirmBtn) {
      confirmBtn = document.querySelector('#confirmation-modal .btn-success');
    }
    if (!confirmBtn) {
      confirmBtn = document.querySelector('#confirmation-modal [data-action="confirm"]');
    }
    if (!confirmBtn) {
      confirmBtn = document.querySelector('.modal-overlay .btn-success');
    }
    if (!confirmBtn) {
      confirmBtn = document.querySelector('.modal-content .btn-success');
    }
    
    if (confirmBtn) {
      console.log('Found confirm button, clicking...', confirmBtn);
      console.log('Confirm button details:', {
        id: confirmBtn.id,
        className: confirmBtn.className,
        visible: confirmBtn.offsetParent !== null,
        element: confirmBtn
      });
      speak('Confirming your vote...');
      setTimeout(() => {
        try {
          confirmBtn.click();
          console.log('Confirm button click executed');
        } catch (error) {
          console.error('Error clicking confirm button:', error);
          // Try alternative click method
          if (confirmBtn.onclick) {
            confirmBtn.onclick();
          } else if (confirmBtn.dispatchEvent) {
            confirmBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        }
      }, 300);
      return;
    } else {
      console.log('Confirm button not found - modal might not be open');
      // Modal might not be open yet, check if we're in voting section
      const votingSection = document.getElementById('voting-section');
      if (votingSection && votingSection.style.display !== 'none') {
        speak('Please select a candidate first by saying "Vote for candidate" followed by the number.');
      }
      return;
    }
  }

  // Check for cancel vote (in modal) - try multiple selectors
  if (command.includes('cancel') || command.includes('no')) {
    console.log('Looking for cancel button in modal');
    let cancelBtn = document.getElementById('modal-cancel-btn');
    if (!cancelBtn) {
      cancelBtn = document.querySelector('#confirmation-modal .btn-secondary');
    }
    if (!cancelBtn) {
      cancelBtn = document.querySelector('#confirmation-modal [data-action="cancel"]');
    }
    if (!cancelBtn) {
      cancelBtn = document.querySelector('.modal-overlay .btn-secondary');
    }
    if (!cancelBtn) {
      cancelBtn = document.querySelector('.modal-content .btn-secondary');
    }
    
    if (cancelBtn) {
      console.log('Found cancel button, clicking...');
      speak('Vote cancelled.');
      cancelBtn.click();
      return;
    } else {
      console.log('Cancel button not found');
    }
  }

  // Extract candidate number from command - try multiple patterns
  let candidateNumber = null;
  const patterns = [
    /candidate\s*(\d+)/i,
    /number\s*(\d+)/i,
    /vote\s*(\d+)/i,
    /select\s*(\d+)/i,
    /choose\s*(\d+)/i,
    /\b(\d+)\b/  // Any standalone number
  ];
  
  // Also handle word numbers
  const wordNumbers = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };
  
  console.log('Extracting candidate number from command:', command);
  
  for (const pattern of patterns) {
    const match = command.match(pattern);
    if (match) {
      candidateNumber = parseInt(match[1]);
      console.log('Found candidate number via pattern:', candidateNumber);
      break;
    }
  }
  
  // Check for word numbers if no numeric match
  if (!candidateNumber) {
    for (const [word, num] of Object.entries(wordNumbers)) {
      if (command.includes(word)) {
        candidateNumber = num;
        console.log('Found candidate number via word:', candidateNumber, 'from word:', word);
        break;
      }
    }
  }
  
  console.log('Final candidate number:', candidateNumber);
  
  // Handle vote for candidate with various phrasings
  // If we found a valid candidate number (1-10), check if we're in voting context
  if (candidateNumber && candidateNumber >= 1 && candidateNumber <= 10) {
    const votingSection = document.getElementById('voting-section');
    const isVotingVisible = votingSection && votingSection.style.display !== 'none';
    
    console.log('Voting section visible:', isVotingVisible);
    console.log('Command contains vote/select/choose:', command.includes('vote') || command.includes('select') || command.includes('choose'));
    
    // Allow voting if:
    // 1. Explicit vote/select/choose command, OR
    // 2. We're in voting section and command mentions candidate/number, OR
    // 3. Command contains a word number (one, two, etc.)
    // 4. OR if we're in voting section and have a number, assume it's a vote command
    const isVoteCommand = command.includes('vote') || 
                          command.includes('select') ||
                          command.includes('choose') ||
                          (isVotingVisible && (command.includes('candidate') || command.includes('number'))) ||
                          Object.keys(wordNumbers).some(word => command.includes(word)) ||
                          (isVotingVisible && candidateNumber); // If in voting section and have a number, assume vote
    
    console.log('Is vote command:', isVoteCommand);
    
    if (isVoteCommand) {
      console.log('Looking for candidate', candidateNumber, 'vote button');
      
      // Try multiple selectors with retry logic
      const findVoteButton = () => {
        // Try multiple selectors
        let voteBtn = document.querySelector(`[data-candidate-number="${candidateNumber}"] .btn-vote`);
        if (!voteBtn) {
          voteBtn = document.querySelector(`.card[data-candidate-number="${candidateNumber}"] .btn-vote`);
        }
        if (!voteBtn) {
          voteBtn = document.querySelector(`[data-candidate-number="${candidateNumber}"] button`);
        }
        if (!voteBtn) {
          // Try by button's own data attribute
          voteBtn = document.querySelector(`.btn-vote[data-candidate-number="${candidateNumber}"]`);
        }
        if (!voteBtn) {
          // Try by ID
          voteBtn = document.getElementById(`vote-btn-${candidateNumber}`);
        }
        if (!voteBtn) {
          // Try finding all buttons and matching
          const allButtons = document.querySelectorAll('.btn-vote');
          console.log('Searching through', allButtons.length, 'vote buttons');
          for (const btn of allButtons) {
            const btnNum = btn.getAttribute('data-candidate-number') || 
                          btn.closest('[data-candidate-number]')?.getAttribute('data-candidate-number') ||
                          btn.id?.replace('vote-btn-', '');
            console.log('Button candidate number:', btnNum, 'for button:', btn);
            if (btnNum && parseInt(btnNum) === candidateNumber) {
              voteBtn = btn;
              break;
            }
          }
        }
        return voteBtn;
      };
      
      let voteBtn = findVoteButton();
      
      // If not found, retry after a short delay (DOM might still be updating)
      if (!voteBtn) {
        console.log('Vote button not found on first attempt, retrying...');
        setTimeout(() => {
          voteBtn = findVoteButton();
          if (voteBtn) {
            console.log('Found vote button on retry, clicking...', voteBtn);
            speak(`Voting for candidate ${candidateNumber}...`);
            setTimeout(() => {
              voteBtn.click();
            }, 300);
          } else {
            console.log('Vote button still not found after retry');
            console.log('Available buttons:', document.querySelectorAll('.btn-vote').length);
            speak(`Candidate ${candidateNumber} not found. Please check the candidate list or try again.`);
          }
        }, 200);
        return;
      }
      
      if (voteBtn) {
        console.log('Found vote button, clicking...', voteBtn);
        console.log('Button details:', {
          id: voteBtn.id,
          className: voteBtn.className,
          dataAttr: voteBtn.getAttribute('data-candidate-number'),
          visible: voteBtn.offsetParent !== null
        });
        speak(`Voting for candidate ${candidateNumber}...`);
        // Use setTimeout to ensure click happens after voice feedback
        setTimeout(() => {
          try {
            voteBtn.click();
            console.log('Button click executed');
          } catch (error) {
            console.error('Error clicking button:', error);
            // Try alternative click method
            if (voteBtn.onclick) {
              voteBtn.onclick();
            } else if (voteBtn.dispatchEvent) {
              voteBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
          }
        }, 300);
        return;
      } else {
        console.log('Vote button not found for candidate', candidateNumber);
        console.log('Available buttons:', document.querySelectorAll('.btn-vote').length);
        speak(`Candidate ${candidateNumber} not found. Please check the candidate list or try again.`);
        return;
      }
    }
  }
  
  // Read candidate list
  if (command.includes('read candidate') || command.includes('candidate list') || command.includes('list candidates')) {
    readCandidateList();
    return;
  }
  
  // Go back
  if (command.includes('go back') || command.includes('back') || command.includes('return')) {
    if (typeof redirectTo === 'function') {
      speak('Going back to home page...');
      redirectTo('home.html');
    }
    return;
  }
  
  // Default help message
  const verifySection = document.getElementById('face-verify-section');
  const votingSection = document.getElementById('voting-section');
  
  if (verifySection && verifySection.style.display !== 'none') {
    speak('Say "Verify identity" to begin verification, or "Go back" to return to home.');
  } else if (votingSection && votingSection.style.display !== 'none') {
    speak('Say "Vote for candidate" followed by the number, "Read candidate list", or "Go back".');
  } else {
    speak('Say "Verify identity" to begin, "Vote for candidate" followed by the number, or "Read candidate list".');
  }
}

/**
 * Handle voice commands on face verification page
 * @param {string} command - Normalized command
 */
function handleFaceVerificationCommands(command) {
  if (command.includes('start') || command.includes('verify') || command.includes('begin')) {
    const startBtn = document.getElementById('btn-start-verification');
    if (startBtn) {
      speak('Starting face verification...');
      startBtn.click();
    }
  } else if (command.includes('retry') || command.includes('try again')) {
    const retryBtn = document.getElementById('btn-retry');
    if (retryBtn) {
      retryBtn.click();
    }
  } else {
    speak('Say "Start verification" to begin face recognition.');
  }
}

// ============================================
// Content Reading Functions
// ============================================

/**
 * Read main page content aloud
 */
function readPageContent() {
  const mainContent = document.querySelector('main') || 
                      document.querySelector('.container') || 
                      document.querySelector('.content-center');
  
  if (!mainContent) {
    speak('No content found to read.');
    return;
  }
  
  // Get text content, excluding buttons and interactive elements
  const text = mainContent.innerText || mainContent.textContent;
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  if (cleanText) {
    speak(cleanText);
  } else {
    speak('No content available to read.');
  }
}

/**
 * Read candidate list aloud
 */
function readCandidateList() {
  const candidates = document.querySelectorAll('.card');
  if (candidates.length === 0) {
    speak('No candidates found.');
    return;
  }
  
  let text = `There are ${candidates.length} candidates. `;
  candidates.forEach((card, index) => {
    const name = card.querySelector('.card-title')?.textContent || `Candidate ${index + 1}`;
    const party = card.querySelector('.card-subtitle')?.textContent || '';
    const description = card.querySelector('.card-description')?.textContent || '';
    text += `Candidate ${index + 1}: ${name}. ${party}. ${description}. `;
  });
  
  speak(text);
}

/**
 * Announce navigation to a new page
 * @param {string} pageName - Name of the page
 */
function announceNavigation(pageName) {
  speak(`You are now on the ${pageName} page.`);
}

/**
 * Handle logout command
 */
function handleLogoutCommand() {
  speak('Logging out...');
  if (typeof clearSession === 'function') {
    clearSession();
  }
  if (typeof redirectTo === 'function') {
    redirectTo('index.html');
  } else {
    window.location.href = 'index.html';
  }
}

// ============================================
// Page Context Management
// ============================================

/**
 * Set current page context for voice commands
 * @param {string} page - Page identifier
 */
function setCurrentPage(page) {
  currentPage = page;
  console.log('Voice context set to:', page);
}

/**
 * Initialize voice assistance for a page
 * @param {string} page - Page identifier
 * @param {boolean} autoStart - Auto-start always-on mode
 */
function initVoiceForPage(page, autoStart = true) {
  setCurrentPage(page);
  
  if (autoStart && !isAlwaysOn) {
    // Enable always-on mode by default
    setAlwaysOnMode(true);
  }
  
  // Read page content on load (with delay for page to render)
  setTimeout(() => {
    if (page === 'home') {
      speak('Welcome to the home page. Say "Go to voting page", "Read rules", "Open profile", or "Log out".');
    } else if (page === 'voting') {
      speak('You are on the voting page. Say "Vote for candidate" followed by the number, or "Read candidate list".');
    }
  }, 1000);
}

// ============================================
// Global Test Functions (for debugging)
// ============================================

/**
 * Test voice command manually (for debugging)
 * Usage in console: testVoiceCommand("vote for candidate 1")
 */
window.testVoiceCommand = function(command) {
  console.log('=== TESTING VOICE COMMAND ===');
  console.log('Command:', command);
  
  // Set page context
  if (typeof setCurrentPage === 'function') {
    setCurrentPage('voting');
    console.log('Page context set to: voting');
  }
  
  // Process command
  if (typeof handleVoiceCommand === 'function') {
    handleVoiceCommand(command);
  } else {
    console.error('handleVoiceCommand function not found!');
  }
  
  console.log('=== END TEST ===');
};

/**
 * Test finding vote button
 * Usage in console: testFindVoteButton(1)
 */
window.testFindVoteButton = function(candidateNumber) {
  console.log('=== TESTING VOTE BUTTON FIND ===');
  console.log('Looking for candidate:', candidateNumber);
  
  const selectors = [
    `[data-candidate-number="${candidateNumber}"] .btn-vote`,
    `.card[data-candidate-number="${candidateNumber}"] .btn-vote`,
    `[data-candidate-number="${candidateNumber}"] button`,
    `.btn-vote[data-candidate-number="${candidateNumber}"]`,
    `#vote-btn-${candidateNumber}`
  ];
  
  selectors.forEach(selector => {
    const btn = document.querySelector(selector);
    console.log(`Selector "${selector}":`, btn ? 'FOUND' : 'NOT FOUND', btn);
  });
  
  const allButtons = document.querySelectorAll('.btn-vote');
  console.log('All vote buttons:', allButtons.length);
  allButtons.forEach((btn, idx) => {
    console.log(`Button ${idx}:`, {
      id: btn.id,
      dataAttr: btn.getAttribute('data-candidate-number'),
      visible: btn.offsetParent !== null
    });
  });
  
  console.log('=== END TEST ===');
};

/**
 * Test finding confirm button
 * Usage in console: testFindConfirmButton()
 */
window.testFindConfirmButton = function() {
  console.log('=== TESTING CONFIRM BUTTON FIND ===');
  
  const selectors = [
    '#modal-confirm-btn',
    '#confirmation-modal .btn-success',
    '#confirmation-modal [data-action="confirm"]',
    '.modal-overlay .btn-success',
    '.modal-content .btn-success'
  ];
  
  selectors.forEach(selector => {
    const btn = document.querySelector(selector);
    console.log(`Selector "${selector}":`, btn ? 'FOUND' : 'NOT FOUND', btn);
  });
  
  const modal = document.getElementById('confirmation-modal');
  console.log('Modal exists:', modal !== null);
  if (modal) {
    console.log('Modal visible:', modal.offsetParent !== null);
  }
  
  console.log('=== END TEST ===');
};

// ============================================
// Export Functions
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initSpeechRecognition,
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    setAlwaysOnMode,
    toggleVoiceAssistance,
    updateVoiceStatus,
    handleVoiceCommand,
    readPageContent,
    readCandidateList,
    announceNavigation,
    setCurrentPage,
    initVoiceForPage
  };
}

