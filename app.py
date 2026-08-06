import os
import json
import requests
from flask import (
    Flask, render_template, request,
    jsonify, session, redirect, url_for, flash
)
from dotenv import load_dotenv
from ibm_watson import AssistantV2
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "fallback-secret-key")

# ──────────────────────────────────────────────
#  IBM Watson Orchestrate / Assistant v2 setup
# ──────────────────────────────────────────────
WATSON_API_KEY = os.getenv("WATSON_ORCHESTRATE_API_KEY", "")
WATSON_URL     = os.getenv("WATSON_ORCHESTRATE_URL", "")
AGENT_ID       = os.getenv("WATSON_ORCHESTRATE_AGENT_ID", "")
ENV_ID         = os.getenv("WATSON_ORCHESTRATE_ENVIRONMENT_ID", "")

def get_watson_client():
    """Return an authenticated AssistantV2 client."""
    authenticator = IAMAuthenticator(WATSON_API_KEY)
    client = AssistantV2(version="2024-08-25", authenticator=authenticator)
    client.set_service_url(WATSON_URL)
    return client


def create_session():
    """Create a new Watson assistant session and return the session_id."""
    client = get_watson_client()
    resp = client.create_session(assistant_id=AGENT_ID).get_result()
    return resp["session_id"]


def send_message(session_id: str, user_text: str) -> str:
    """Send a message and return the assistant's text reply."""
    client = get_watson_client()
    resp = client.message(
        assistant_id=AGENT_ID,
        session_id=session_id,
        input={"message_type": "text", "text": user_text},
        context={
            "global": {
                "system": {"user_defined": {}, "turn_count": 1}
            }
        },
    ).get_result()

    # Extract first text response
    for generic in resp.get("output", {}).get("generic", []):
        if generic.get("response_type") == "text":
            return generic.get("text", "")
    return "I'm here to help. Could you tell me more?"


# ──────────────────────────────────────────────
#  Routes – pages
# ──────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/chat")
def chat():
    return render_template("chat.html")


@app.route("/profile", methods=["GET", "POST"])
def profile():
    if request.method == "POST":
        profile_data = {
            "name":        request.form.get("name", "").strip(),
            "age":         request.form.get("age", "").strip(),
            "grade":       request.form.get("grade", "").strip(),
            "interests":   request.form.getlist("interests"),
            "strengths":   request.form.get("strengths", "").strip(),
            "goals":       request.form.get("goals", "").strip(),
        }
        session["student_profile"] = profile_data
        flash("Profile saved successfully!", "success")
        return redirect(url_for("dashboard"))
    profile_data = session.get("student_profile", {})
    return render_template("profile.html", profile=profile_data)


@app.route("/dashboard")
def dashboard():
    profile_data = session.get("student_profile", {})
    return render_template("dashboard.html", profile=profile_data)


@app.route("/roadmap")
def roadmap():
    profile_data = session.get("student_profile", {})
    return render_template("roadmap.html", profile=profile_data)


@app.route("/streams")
def streams():
    return render_template("streams.html")


# ──────────────────────────────────────────────
#  Routes – API
# ──────────────────────────────────────────────

@app.route("/api/chat/start", methods=["POST"])
def api_chat_start():
    """Initialise a Watson session and store session_id in the Flask session."""
    if not WATSON_API_KEY or not AGENT_ID:
        return jsonify({"error": "Watson credentials not configured"}), 503
    try:
        sid = create_session()
        session["watson_session_id"] = sid
        return jsonify({"session_id": sid})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/chat/message", methods=["POST"])
def api_chat_message():
    """Relay a user message to Watson and return the response."""
    data = request.get_json(force=True)
    user_text = data.get("message", "").strip()
    if not user_text:
        return jsonify({"error": "Empty message"}), 400

    watson_session_id = session.get("watson_session_id")
    if not watson_session_id:
        return jsonify({"error": "No active Watson session – call /api/chat/start first"}), 400

    try:
        reply = send_message(watson_session_id, user_text)
        return jsonify({"reply": reply})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/profile", methods=["GET"])
def api_profile():
    """Return the stored student profile as JSON."""
    return jsonify(session.get("student_profile", {}))


@app.route("/api/roadmap", methods=["GET"])
def api_roadmap():
    """Return a suggested roadmap based on the profile stream."""
    profile_data = session.get("student_profile", {})
    stream   = profile_data.get("grade", "general")
    roadmaps = _build_roadmap(stream)
    return jsonify(roadmaps)


def _build_roadmap(stream: str) -> dict:
    """Static roadmap data keyed by academic stream."""
    base = {
        "Science": {
            "title": "Science & Technology Roadmap",
            "phases": [
                {"phase": "Foundation", "months": "1-3",  "tasks": ["Master core Physics & Chemistry", "Strengthen Mathematics fundamentals", "Join STEM club or hackathon"]},
                {"phase": "Exploration","months": "4-6",  "tasks": ["Explore Biology / Computer Science elective", "Attempt first competitive exam (JEE/NEET mock)", "Online course: Python or Data Science basics"]},
                {"phase": "Specialise", "months": "7-9",  "tasks": ["Choose Engineering / Medical / Research track", "Internship or lab project", "Build a portfolio project"]},
                {"phase": "Launch",     "months": "10-12","tasks": ["Apply to target colleges", "Prepare for entrance exams", "Attend career fairs & mentorship sessions"]},
            ],
        },
        "Commerce": {
            "title": "Commerce & Business Roadmap",
            "phases": [
                {"phase": "Foundation", "months": "1-3",  "tasks": ["Strengthen Accounts & Economics concepts", "Learn Excel / basic financial modelling", "Read one business book per month"]},
                {"phase": "Exploration","months": "4-6",  "tasks": ["Explore CA / MBA / Fintech pathways", "Join debates & case-study competitions", "Start a small entrepreneurship project"]},
                {"phase": "Specialise", "months": "7-9",  "tasks": ["Prepare for CA Foundation or BBA entrance", "Internship at a firm or startup", "Build LinkedIn profile"]},
                {"phase": "Launch",     "months": "10-12","tasks": ["Apply to B-schools & commerce colleges", "Attempt entrance exams", "Network with alumni"]},
            ],
        },
        "Arts": {
            "title": "Arts & Humanities Roadmap",
            "phases": [
                {"phase": "Foundation", "months": "1-3",  "tasks": ["Deepen core subject mastery (History, Pol Sci, etc.)", "Read widely across disciplines", "Start a creative project or blog"]},
                {"phase": "Exploration","months": "4-6",  "tasks": ["Explore Law / Design / Media / Civil Services paths", "Participate in MUNs or essay competitions", "Take a short online course in your interest area"]},
                {"phase": "Specialise", "months": "7-9",  "tasks": ["Decide between UPSC / Law entrance / Design college", "Build a portfolio or writing samples", "Seek a mentor in your field"]},
                {"phase": "Launch",     "months": "10-12","tasks": ["Apply to target universities", "Prepare for entrance exams (CLAT, NID, etc.)", "Document achievements for applications"]},
            ],
        },
    }
    return base.get(stream, {
        "title": "General Career Roadmap",
        "phases": [
            {"phase": "Self-Discovery","months": "1-2", "tasks": ["Explore interests via quizzes & counselling", "Talk to professionals in various fields"]},
            {"phase": "Foundation",    "months": "3-5", "tasks": ["Strengthen core academic subjects", "Develop soft skills: communication, teamwork"]},
            {"phase": "Exploration",   "months": "6-9", "tasks": ["Try internships, clubs, or online courses", "Shortlist 3 career paths"]},
            {"phase": "Launch",        "months": "10-12","tasks": ["Choose a stream or college path", "Prepare and apply"]},
        ],
    })


# ──────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True)
