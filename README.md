# CmdGenie AI ⚡
> **Folder Intelligence & Autonomous Admin Command Engine**  
> Select any folder on your PC/laptop, ask questions in human language (e.g. *"How many files exist with name vinod?"*), let Gemini AI generate exact PowerShell commands, execute them with **Full Windows Administrator Privileges**, and view real terminal output with a synthesized conversational answer.

---

## ✨ Features

- 📁 **Universal Folder Selection**:
  - **Native Windows OS Folder Dialog**: 1-click button to open the familiar Windows folder picker.
  - **In-App Directory Explorer**: Browse folders, drives (`C:\`, `D:\`), and parent directories.
  - **Direct Path Input**: Type or paste any directory path.
  - **Quick Shortcuts**: 1-click access to Desktop, Downloads, Documents, and drives.
  - **Live Folder Snapshot**: Immediate file count, subdirectories, and file extension breakdown.

- 🧠 **Dual-Stage Gemini AI Engine**:
  - **Stage 1 (Command Generation)**: Gemini translates human requests into precise, optimized, non-interactive PowerShell / Shell commands tailored to the selected folder.
  - **Stage 2 (Human Answer Synthesis)**: Gemini parses the real terminal stdout/stderr to formulate a direct, natural human language summary (e.g., *"Found 3 files matching 'vinod'..."*).

- 🛡️ **Full Windows Administrator Execution**:
  - Backend runs with **Administrator Access** on Windows.
  - Capable of executing system commands, inspecting protected directories, querying Windows services, and running administrative PowerShell cmdlets without *"Access is denied"* errors.
  - Self-elevating launcher (`start_admin.bat`) triggers Windows UAC with a single click.

- 💻 **Live Interactive Terminal**:
  - Realistic terminal console window with status pills (`Exit Code: 0`, execution duration in milliseconds).
  - Clean separation of standard output (`stdout`) and error streams (`stderr`).
  - 1-click buttons to **Copy Command**, **Copy Output**, and **Run Again**.

- 🎨 **Pure Modern CSS (Zero Framework Bloat)**:
  - Built with clean, standard CSS and CSS variables.
  - High-tech cyber/dark theme optimized for desktop monitors and laptop screens.
  - Responsive design with smooth animations and modal dialogs.

- 🗄️ **Zero-Config History Audit Log**:
  - Automatically records queries, generated commands, terminal outputs, and execution metrics into a lightweight local SQLite database (`data/history.db`).
  - No database server (like MongoDB or Postgres) needed to install or configure—works completely out of the box!

---

## 🏗️ Architecture

```
User (Laptop / PC)
       │
       ▼
React Frontend (Vite + Pure CSS)  ◄─── Port 5173
       │
       ▼ REST API Calls
Python FastAPI Backend (Admin Privileges) ◄─── Port 8000
       │
       ├──► 1. Ask Gemini API (generates PowerShell command)
       │
       ├──► 2. Execute Command in Selected Folder (subprocess / PowerShell)
       │
       ├──► 3. Ask Gemini API (synthesizes humanic answer from stdout)
       │
       └──► 4. Save to Local SQLite Audit Log (data/history.db)
```

---

## 🚀 Quick Start (1-Click Launch for Any Windows PC)

### Prerequisites
1. **Windows 10 or 11**
2. **Python 3.10+** (check *"Add Python to PATH"* during install)
3. **Node.js LTS** (from [nodejs.org](https://nodejs.org))
4. **Google Gemini API Key** (Get free from [Google AI Studio](https://aistudio.google.com/app/apikey))

### Method A: Run with Full Administrator Privileges (Recommended)
1. Right-click **`start_admin.bat`** and click **Run as administrator** (or simply double-click it and click **"Yes"** on the Windows UAC prompt).
2. The script will automatically:
   - Create the Python virtual environment (`backend/venv`).
   - Install all required backend and frontend packages.
   - Start the FastAPI backend and React frontend.
   - Open your browser to `http://localhost:5173`.
3. In the UI, click **Settings** to paste your Gemini API key (or configure `GEMINI_API_KEY=your_key` in the standalone root `.env` file).

### Method B: Standard User Mode
Double-click **`start.bat`** (or run `powershell -File start.ps1`).

---

## 🛠️ Manual Installation (For Developers)

If you prefer running commands manually:

### 1. Environment Configuration
```powershell
# Copy the template at the project root
copy .env.example .env
# Edit .env and paste your GEMINI_API_KEY
```

### 2. Backend Setup
```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend
python run.py
```
Backend will start on `http://127.0.0.1:8000`.

### 3. Frontend Setup
```powershell
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will be available at `http://localhost:5173`.

---

## 💡 Example Queries You Can Ask

Select any folder (e.g. `C:\Users\YourName\Desktop` or `D:\Data`) and try asking:

| Human Question | What Gemini Generates & Runs |
| :--- | :--- |
| **"How many files exist with name vinod?"** | `Get-ChildItem -Recurse -File -Filter "*vinod*" -ErrorAction SilentlyContinue \| ...` |
| **"Find the 5 largest files in this folder"** | `Get-ChildItem -Recurse -File -ErrorAction SilentlyContinue \| Sort-Object Length -Descending \| Select-Object -First 5 ...` |
| **"List files modified in the last 7 days"** | `Get-ChildItem -Recurse -File \| Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-7) }` |
| **"Show all PDF and Excel documents"** | `Get-ChildItem -Recurse -File -Include *.pdf, *.xlsx, *.xls` |
| **"Count lines of code across all python files"** | `(Get-ChildItem -Recurse -Filter *.py \| Get-Content \| Measure-Object).Count` |
| **"Search for files containing the word 'password'"** | `Select-String -Path ".\*.*" -Pattern "password" -ErrorAction SilentlyContinue` |

---

## 📡 API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check and Administrator privilege status |
| `/api/fs/pick-native` | `POST` | Triggers the native Windows OS FolderBrowserDialog |
| `/api/fs/browse` | `GET` | Lists subdirectories for the in-app folder explorer |
| `/api/fs/stats` | `POST` | Inspects folder file count, subdirectories, and file types |
| `/api/ai/test-key` | `POST` | Tests connectivity and validity of a Gemini API Key |
| `/api/ai/ask` | `POST` | **End-to-end pipeline**: Generates command ➔ Executes with Admin access ➔ Synthesizes human answer ➔ Logs to SQLite |
| `/api/command/execute` | `POST` | Directly runs a shell command with backend privileges |
| `/api/history` | `GET / DELETE` | Retrieves or clears query and execution audit logs |

---

## 🔒 Security & Admin Permissions

- The backend executes shell commands with the privileges of the active session.
- When launched using **`start_admin.bat`**, the backend inherits Windows Administrator tokens, enabling full system inspection capabilities.
- Gemini is configured via prompt engineering to **never** generate destructive commands (`Remove-Item`, format, `rm -rf`) unless the user explicitly orders a deletion.
- You can turn off **"Auto-execute generated command"** in the UI to review every command before running it.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
