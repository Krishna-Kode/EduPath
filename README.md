# EduPath — AI-Powered Student Career & Study Guide

> A Python Flask web application that integrates with an **IBM Watson Orchestrate** agent to provide personalised academic stream guidance, career roadmaps, and an AI chatbot for students.

---

## Features

| Feature | Description |
|---|---|
| **AI Chatbot** | Full conversational interface backed by IBM Watson Orchestrate |
| **Student Profile** | Form to capture interests, stream, strengths, and career goals |
| **Career Dashboard** | Skill-readiness meters, career paths, and profile summary |
| **Learning Roadmap** | Phase-based, stream-specific 12-month study plan |
| **Stream Explorer** | Interactive Science / Commerce / Arts comparison & selector |
| **Dark Mode** | Persistent dark/light toggle (respects OS preference) |
| **Responsive UI** | Bootstrap 5.3 — works on mobile, tablet, and desktop |

---

## Project Structure

```
EduPath/
├── app.py                  # Flask application & Watson integration
├── requirements.txt        # Python dependencies
├── .env                    # Secret environment variables (never commit)
├── .env.example            # Template for .env
├── Procfile                # For Heroku / Railway deployment
├── templates/
│   ├── base.html           # Base layout (navbar, dark mode, footer)
│   ├── index.html          # Landing page
│   ├── chat.html           # AI chatbot page
│   ├── profile.html        # Student profile form
│   ├── dashboard.html      # Career dashboard
│   ├── roadmap.html        # Learning roadmap
│   └── streams.html        # Stream selection & comparison
└── static/
    ├── css/
    │   └── edupath.css     # Custom styles (light + dark mode)
    └── js/
        └── edupath.js      # Dark mode, chat, roadmap, stream logic
```

---

## Prerequisites

- Python 3.10+
- An **IBM Watson Orchestrate** instance with an agent deployed
- `pip` (Python package manager)

---

## Quick Start (Local Development)

### 1. Clone / download the project

```bash
git clone https://github.com/your-org/edupath.git
cd edupath
```

### 2. Create a virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-very-long-random-secret-key

# IBM Watson Orchestrate credentials
WATSON_ORCHESTRATE_AGENT_ID=<your-assistant-id>
WATSON_ORCHESTRATE_API_KEY=<your-iam-api-key>
WATSON_ORCHESTRATE_URL=https://api.us-south.assistant.watson.cloud.ibm.com
WATSON_ORCHESTRATE_ENVIRONMENT_ID=<your-environment-id>
```

> **Where to find Watson credentials:**  
> IBM Cloud → Resource List → Watson Assistant → your instance → Manage → Credentials.  
> The *Assistant ID* is found inside the Watson Assistant UI under Settings → API Details.

### 5. Run the development server

```bash
flask run
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ | Flask session signing key — use a long random string |
| `FLASK_ENV` | ✅ | `development` or `production` |
| `WATSON_ORCHESTRATE_API_KEY` | ✅ | IBM IAM API key |
| `WATSON_ORCHESTRATE_AGENT_ID` | ✅ | Watson Assistant / Orchestrate agent ID |
| `WATSON_ORCHESTRATE_URL` | ✅ | Service URL (region-dependent) |
| `WATSON_ORCHESTRATE_ENVIRONMENT_ID` | ⬜ | Required only for multi-environment setups |

---

## Deployment

### Option A — Heroku

1. Create a `Procfile` (already included):
   ```
   web: gunicorn app:app
   ```

2. Push to Heroku:
   ```bash
   heroku create edupath-app
   heroku config:set SECRET_KEY=... WATSON_ORCHESTRATE_API_KEY=... WATSON_ORCHESTRATE_AGENT_ID=... WATSON_ORCHESTRATE_URL=...
   git push heroku main
   ```

### Option B — Railway

1. Connect your GitHub repo at [railway.app](https://railway.app).
2. Add environment variables under **Variables**.
3. Railway auto-detects the `Procfile` and deploys.

### Option C — IBM Code Engine (recommended for Watson projects)

```bash
ibmcloud ce project create --name edupath
ibmcloud ce app create \
  --name edupath \
  --image icr.io/your-namespace/edupath:latest \
  --env SECRET_KEY=... \
  --env WATSON_ORCHESTRATE_API_KEY=... \
  --env WATSON_ORCHESTRATE_AGENT_ID=... \
  --env WATSON_ORCHESTRATE_URL=...
```

### Option D — Docker

```dockerfile
# Dockerfile (create this file)
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
```

```bash
docker build -t edupath .
docker run -p 8000:8000 --env-file .env edupath
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat/start` | Create a new Watson session |
| `POST` | `/api/chat/message` | Send a message and get AI reply |
| `GET` | `/api/profile` | Retrieve session profile as JSON |
| `GET` | `/api/roadmap` | Get stream-based roadmap data |

---

## IBM Watson Orchestrate Integration

The app uses the **Watson Assistant v2 API** (compatible with Watson Orchestrate agents):

- `POST /v2/assistants/{assistant_id}/sessions` — creates a session
- `POST /v2/assistants/{assistant_id}/sessions/{session_id}/message` — sends a message

The session ID is stored in the Flask server-side session (cookie-based, signed by `SECRET_KEY`).

---

## Security Notes

- **Never commit `.env`** — it is listed in `.gitignore`.
- Rotate your `SECRET_KEY` before deploying to production.
- In production, set `FLASK_ENV=production` and use HTTPS.
- Watson API keys should be restricted to the minimum required IAM roles.

---

## License

MIT — see `LICENSE` for details.
