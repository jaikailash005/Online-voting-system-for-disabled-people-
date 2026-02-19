# Inclusive Voting Web App

A fully functional, accessible voting web application designed for differentially abled citizens. Built with vanilla HTML, CSS, and JavaScript (no frameworks).

## Features

- **Secure Login**: Aadhar Number and Password authentication
- **Facial Recognition**: Face-api.js integration for identity verification and duplicate voting prevention
- **Voice Assistance**: Always-on voice commands using Web Speech API
- **Accessibility**: High contrast design, large fonts, keyboard navigation, screen reader support
- **10 Candidate Voting**: Display and vote for political candidates
- **Vote Confirmation**: Secure vote storage with confirmation dialogs

## File Structure

```
inclusive-voting-app/
├── index.html              (Login page)
├── face-verification.html  (Facial recognition verification)
├── home.html               (Home page with rules and navigation)
├── voting.html             (Voting page with candidate cards)
├── styles.css              (Shared stylesheet)
├── script.js               (Core functionality)
├── voice.js                (Voice assistance)
└── README.md               (This file)
```

## Setup Instructions

1. **No Installation Required**: This is a client-side only application. Simply open `index.html` in a modern web browser.

2. **Browser Requirements**:
   - Chrome/Edge (recommended) - Full support for Speech Recognition and MediaDevices
   - Firefox - Partial support (may need polyfills)
   - Safari - Partial support (webkit prefixes)

3. **Camera Access**: The app requires camera access for facial recognition. Allow camera permissions when prompted.

4. **Microphone Access**: The app requires microphone access for voice commands. Allow microphone permissions when prompted.

5. **Internet Connection**: Required for loading face-api.js models from CDN.

## Usage

### Login
1. Open `index.html` in your browser
2. Enter a 12-digit Aadhar Number (demo accepts any 12-digit number)
3. Enter any password (demo accepts any non-empty password)
4. Click "Login" or say "Login" (voice command)

### Face Verification
1. After login, you'll be redirected to face verification
2. Click "Start Verification" or say "Start verification"
3. Allow camera access when prompted
4. Position your face in front of the camera
5. Wait for verification to complete

### Home Page
- View voting rules and regulations
- Navigate using menu or voice commands:
  - "Go to voting page"
  - "Read rules"
  - "Open profile"
  - "Log out"

### Voting
1. Click "Vote Now" or say "Go to voting page"
2. Complete pre-vote face verification
3. Review the 10 candidates
4. Click "Vote" on your preferred candidate or say "Vote for candidate [number]"
5. Confirm your vote
6. View thank you message

## Voice Commands

### Login Page
- "Login" - Submit login form
- "Clear" - Clear form fields
- "Back" - Acknowledge current page

### Home Page
- "Go to voting page" / "Vote now" - Navigate to voting
- "Read rules" - Read voting rules aloud
- "Open profile" - Open profile menu
- "Log out" / "Logout" - Logout and return to login

### Voting Page
- "Vote for candidate [number]" - Vote for specific candidate
- "Read candidate list" - Read all candidates aloud
- "Go back" - Return to home page
- "Confirm" - Confirm vote in dialog
- "Cancel" - Cancel vote in dialog

### Face Verification Page
- "Start verification" / "Start" - Begin face verification
- "Try again" / "Retry" - Retry verification

## Technical Details

### Face Recognition
- Uses face-api.js library (loaded from CDN)
- Models: TinyFaceDetector, FaceLandmark68Net, FaceRecognitionNet
- Face descriptors stored in localStorage
- Comparison threshold: 0.6 (adjustable)

### Data Storage
- **localStorage keys**:
  - `voting_session` - Current user session (Aadhar number)
  - `face_descriptors` - Stored face data (JSON)
  - `votes` - Array of vote records
  - `has_voted_[aadhar]` - Boolean flag per user

### Security (Demo)
- Client-side validation only (for demonstration)
- Face verification prevents duplicate voting
- Votes stored in browser localStorage (not secure for production)
- This is a demonstration system

## Accessibility Features

- **High Contrast**: Light background, dark text for readability
- **Large Fonts**: Minimum 18px base font size
- **Big Buttons**: Minimum 44x44px touch targets
- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Escape)
- **Screen Reader Support**: ARIA labels, roles, and live regions
- **Voice Commands**: All actions accessible via voice
- **Focus Indicators**: Clear 3px focus outlines
- **Skip Links**: Skip to main content links

## Browser Compatibility

| Browser | Speech Recognition | MediaDevices | Status |
|---------|-------------------|--------------|--------|
| Chrome  | ✅ Full           | ✅ Full      | Recommended |
| Edge    | ✅ Full           | ✅ Full      | Recommended |
| Firefox | ⚠️ Partial        | ✅ Full      | Works with limitations |
| Safari  | ⚠️ Partial        | ✅ Full      | Works with limitations |

## Troubleshooting

### Camera Not Working
- Ensure camera permissions are granted
- Check if another application is using the camera
- Try refreshing the page

### Voice Commands Not Working
- Ensure microphone permissions are granted
- Check browser compatibility (Chrome/Edge recommended)
- Verify microphone is not muted
- Check browser console for errors

### Face Recognition Fails
- Ensure good lighting
- Position face directly in front of camera
- Remove glasses or hat if possible
- Try again after a few seconds

### Models Not Loading
- Check internet connection (models load from CDN)
- Wait a few seconds for models to load
- Refresh the page if models fail to load

## Development Notes

- All code is vanilla JavaScript (no frameworks)
- Face-api.js loaded from CDN (no local file needed)
- Responsive design for mobile and desktop
- Clear code comments throughout
- Error handling for all operations

## License

This is a demonstration project for educational purposes.

## Support

For issues or questions, please check the browser console for error messages and ensure all permissions are granted.

---

**Note**: This is a demonstration application. For production use, implement proper server-side authentication, secure vote storage, and additional security measures.

