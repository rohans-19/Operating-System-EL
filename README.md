# Sandboxed Program Runner - React + Flask

## Features
✓ React frontend with modern UI
✓ Real-time output streaming
✓ Seccomp syscall detection and display
✓ Verdict parsing (BLOCKED BY SECCOMP, EXECUTION COMPLETED, etc.)
✓ Interactive stdin input

## Project Structure
```
project/
├── backend/
│   ├── server.py           # Flask backend with CORS
│   ├── sandbox             # Your sandbox executable
│   └── tmp/                # Temporary files (auto-created)
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── App.css         # Styling
│   │   ├── index.js        # React entry point
│   │   └── index.css
│   └── package.json
│
└── requirements.txt
```

## Setup Instructions

### Backend Setup
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Make sure your sandbox executable is compiled and in the backend folder

3. Run Flask server:
   ```bash
   cd backend
   python server.py
   ```
   Server runs on http://localhost:5000

### Frontend Setup
1. Create React app structure:
   ```bash
   npx create-react-app frontend
   cd frontend
   ```

2. Replace the files in src/ and public/ with provided files:
   - src/App.js
   - src/App.css
   - src/index.js
   - src/index.css
   - public/index.html

3. Install dependencies and start:
   ```bash
   npm install
   npm start
   ```
   Frontend runs on http://localhost:3000

## Key Features Implemented

### 1. Verdict Detection
The app parses terminal output and displays verdicts:
- **BLOCKED BY SECCOMP**: When "Bad system call" is detected
- **SEGMENTATION FAULT**: When segfault occurs
- **COMPILATION ERROR**: When GCC compilation fails
- **EXECUTION COMPLETED**: When program finishes successfully

### 2. Seccomp Syscall Tracking
Automatically extracts and displays syscalls from terminal:
```
[SYSCALL] 157 (runtime/internal)
[SYSCALL] 12 (brk)
```
Shows as colored tags with syscall name and number.

### 3. Real-time Output
- 100ms polling interval
- Auto-scrolling output window
- Preserves all terminal formatting

### 4. Interactive Input
- Send input to running programs via stdin
- Press Enter or click Send button
- Input field disabled when no process running

## Usage
1. Write C code in the editor
2. Click "Compile & Run"
3. Watch output stream in real-time
4. See verdict and syscalls detected
5. Provide stdin input if needed

## CORS Configuration
Flask backend configured with flask-cors to allow React frontend access.
