/* ============================================
   Inclusive Voting App - Core Script
   Session management, vote storage, navigation
   ============================================ */

// ============================================
// Storage Keys
// ============================================
const STORAGE_KEYS = {
  SESSION: 'voting_session',
  FACE_DESCRIPTORS: 'face_descriptors',
  VOTES: 'votes',
  HAS_VOTED_PREFIX: 'has_voted_'
};

// ============================================
// Session Management
// ============================================

/**
 * Get current user session (Aadhar number)
 * @returns {string|null} Aadhar number or null
 */
function getCurrentSession() {
  return localStorage.getItem(STORAGE_KEYS.SESSION);
}

/**
 * Set current user session
 * @param {string} aadhar - Aadhar number
 */
function setCurrentSession(aadhar) {
  localStorage.setItem(STORAGE_KEYS.SESSION, aadhar);
}

/**
 * Clear current session (logout)
 */
function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
function isLoggedIn() {
  return getCurrentSession() !== null;
}

// ============================================
// Face Verification State Management
// ============================================

/**
 * Store face descriptor for a user
 * @param {string} aadhar - Aadhar number
 * @param {Float32Array} descriptor - Face descriptor array
 */
function storeFaceDescriptor(aadhar, descriptor) {
  const descriptors = getFaceDescriptors();
  descriptors[aadhar] = Array.from(descriptor); // Convert to regular array for JSON
  localStorage.setItem(STORAGE_KEYS.FACE_DESCRIPTORS, JSON.stringify(descriptors));
}

/**
 * Get stored face descriptor for a user
 * @param {string} aadhar - Aadhar number
 * @returns {Float32Array|null} Face descriptor or null
 */
function getFaceDescriptor(aadhar) {
  const descriptors = getFaceDescriptors();
  if (descriptors[aadhar]) {
    return new Float32Array(descriptors[aadhar]);
  }
  return null;
}

/**
 * Get all face descriptors
 * @returns {Object} Object with aadhar as keys and descriptors as values
 */
function getFaceDescriptors() {
  const stored = localStorage.getItem(STORAGE_KEYS.FACE_DESCRIPTORS);
  return stored ? JSON.parse(stored) : {};
}

/**
 * Check if user has already voted
 * @param {string} aadhar - Aadhar number
 * @returns {boolean}
 */
function hasUserVoted(aadhar) {
  const key = STORAGE_KEYS.HAS_VOTED_PREFIX + aadhar;
  return localStorage.getItem(key) === 'true';
}

/**
 * Mark user as having voted
 * @param {string} aadhar - Aadhar number
 */
function markUserAsVoted(aadhar) {
  const key = STORAGE_KEYS.HAS_VOTED_PREFIX + aadhar;
  localStorage.setItem(key, 'true');
}

// ============================================
// Vote Storage
// ============================================

/**
 * Store a vote securely
 * @param {string} aadhar - Aadhar number
 * @param {Object} candidate - Candidate object with name, party, etc.
 * @returns {boolean} Success status
 */
function storeVote(aadhar, candidate) {
  try {
    // Get existing votes
    const votes = getVotes();
    
    // Create vote record
    const voteRecord = {
      aadhar: aadhar,
      candidate: candidate,
      timestamp: Date.now(),
      date: new Date().toISOString()
    };
    
    // Add to votes array
    votes.push(voteRecord);
    
    // Store back to localStorage
    localStorage.setItem(STORAGE_KEYS.VOTES, JSON.stringify(votes));
    
    // Mark user as voted
    markUserAsVoted(aadhar);
    
    return true;
  } catch (error) {
    console.error('Error storing vote:', error);
    return false;
  }
}

/**
 * Get all votes
 * @returns {Array} Array of vote records
 */
function getVotes() {
  const stored = localStorage.getItem(STORAGE_KEYS.VOTES);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Get vote count for a candidate
 * @param {string} candidateName - Candidate name
 * @returns {number} Vote count
 */
function getCandidateVoteCount(candidateName) {
  const votes = getVotes();
  return votes.filter(vote => vote.candidate.name === candidateName).length;
}

// ============================================
// Navigation Helpers
// ============================================

/**
 * Redirect to a page
 * @param {string} page - Page filename (e.g., 'home.html')
 * @param {Object} params - Optional query parameters
 */
function redirectTo(page, params = {}) {
  let url = page;
  if (Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    url += '?' + queryString;
  }
  window.location.href = url;
}

/**
 * Check authentication and redirect if needed
 * @param {string} redirectToPage - Page to redirect to if not logged in
 */
function requireAuth(redirectToPage = 'index.html') {
  if (!isLoggedIn()) {
    redirectTo(redirectToPage);
    return false;
  }
  return true;
}

// ============================================
// Login Validation
// ============================================

/**
 * Validate login credentials
 * @param {string} aadhar - Aadhar number
 * @param {string} password - Password
 * @returns {Object} { valid: boolean, message: string }
 */
function validateLogin(aadhar, password) {
  // Basic validation - non-empty fields
  if (!aadhar || aadhar.trim() === '') {
    return {
      valid: false,
      message: 'Please enter your Aadhar Number.'
    };
  }
  
  if (!password || password.trim() === '') {
    return {
      valid: false,
      message: 'Please enter your Password.'
    };
  }
  
  // Aadhar number should be 12 digits (basic validation)
  const aadharRegex = /^\d{12}$/;
  if (!aadharRegex.test(aadhar.trim())) {
    return {
      valid: false,
      message: 'Aadhar Number must be 12 digits.'
    };
  }
  
  // For demo purposes, accept any valid format
  // In production, this would check against a database
  return {
    valid: true,
    message: 'Login successful.'
  };
}

// ============================================
// Confirmation Dialog
// ============================================

/**
 * Show confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback on confirm
 * @param {Function} onCancel - Optional callback on cancel
 */
function showConfirmation(message, onConfirm, onCancel = null) {
  // Remove existing modal if any
  const existingModal = document.getElementById('confirmation-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'confirmation-modal';
  overlay.className = 'modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-labelledby', 'modal-title');
  overlay.setAttribute('aria-modal', 'true');
  
  // Create modal content
  const content = document.createElement('div');
  content.className = 'modal-content';
  
  const title = document.createElement('h2');
  title.id = 'modal-title';
  title.className = 'modal-title';
  title.textContent = 'Confirm Your Vote';
  
  const messageEl = document.createElement('p');
  messageEl.textContent = message;
  messageEl.style.fontSize = 'var(--font-size-large)';
  messageEl.style.marginBottom = 'var(--spacing-md)';
  
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  
  const confirmBtn = document.createElement('button');
  confirmBtn.id = 'modal-confirm-btn';
  confirmBtn.className = 'btn btn-success';
  confirmBtn.textContent = 'Confirm';
  confirmBtn.setAttribute('data-action', 'confirm');
  confirmBtn.addEventListener('click', () => {
    overlay.remove();
    if (onConfirm) onConfirm();
  });
  
  const cancelBtn = document.createElement('button');
  cancelBtn.id = 'modal-cancel-btn';
  cancelBtn.className = 'btn btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.setAttribute('data-action', 'cancel');
  cancelBtn.addEventListener('click', () => {
    overlay.remove();
    if (onCancel) onCancel();
  });
  
  // Handle Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      if (onCancel) onCancel();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  // Trap focus within modal
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.remove();
      if (onCancel) onCancel();
    }
  });
  
  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);
  
  content.appendChild(title);
  content.appendChild(messageEl);
  content.appendChild(actions);
  
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  
  // Focus on confirm button
  setTimeout(() => {
    confirmBtn.focus();
    // Log for debugging
    console.log('Confirmation modal opened');
    console.log('Confirm button ID:', confirmBtn.id);
    console.log('Cancel button ID:', cancelBtn.id);
    // Ensure buttons are accessible
    console.log('Confirm button accessible:', confirmBtn.offsetParent !== null);
    console.log('Cancel button accessible:', cancelBtn.offsetParent !== null);
  }, 100);
}

// ============================================
// Status Messages
// ============================================

/**
 * Show status message
 * @param {string} message - Message text
 * @param {string} type - 'success', 'error', or 'info'
 * @param {number} duration - Auto-hide duration in ms (0 = no auto-hide)
 */
function showStatusMessage(message, type = 'info', duration = 5000) {
  // Remove existing messages
  const existing = document.querySelector('.status-message');
  if (existing) {
    existing.remove();
  }
  
  const statusEl = document.createElement('div');
  statusEl.className = `status-message ${type}`;
  statusEl.setAttribute('role', 'alert');
  statusEl.setAttribute('aria-live', 'polite');
  statusEl.textContent = message;
  
  // Insert at top of main content or body
  const main = document.querySelector('main') || document.querySelector('.container') || document.body;
  if (main.firstChild) {
    main.insertBefore(statusEl, main.firstChild);
  } else {
    main.appendChild(statusEl);
  }
  
  // Auto-hide if duration specified
  if (duration > 0) {
    setTimeout(() => {
      statusEl.remove();
    }, duration);
  }
  
  return statusEl;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Format date for display
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================
// Export for use in other scripts
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getCurrentSession,
    setCurrentSession,
    clearSession,
    isLoggedIn,
    storeFaceDescriptor,
    getFaceDescriptor,
    getFaceDescriptors,
    hasUserVoted,
    markUserAsVoted,
    storeVote,
    getVotes,
    getCandidateVoteCount,
    redirectTo,
    requireAuth,
    validateLogin,
    showConfirmation,
    showStatusMessage,
    formatDate,
    debounce
  };
}

