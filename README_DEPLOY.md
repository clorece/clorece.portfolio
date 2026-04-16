# Deploying Your Portfolio and Langy Bot

This project is now a dual-service application:
1.  **Backend (Python):** A unified FastAPI + Discord Bot server.
2.  **Frontend (React):** A modern portfolio website with a Langy web interface.

## 1. Backend Setup

### Prerequisites
- Python 3.8+
- Discord Developer Portal: Create an application, get your `CLIENT_ID` and `CLIENT_SECRET`.
- Add a Redirect URI in Discord: `http://localhost:10000/api/auth/callback` (for local testing).

### Environment Variables
Update your `.env` file:
```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:10000/api/auth/callback
SECRET_KEY=a-long-random-string-for-security
FRONTEND_URL=http://localhost:5173
```

### Installation & Running
1.  Install dependencies: `pip install -r requirements.txt`
2.  Run the server: `python api.py`
    - This will start the Web API on port 10000 and the Discord Bot in the background.

## 2. Frontend Setup

1.  Navigate to the web folder: `cd portfolio-web`
2.  Install dependencies: `npm install`
3.  Run development server: `npm run dev`
4.  Open `http://localhost:5173` in your browser.

## 3. Hosting Recommendations

- **Backend:** Deploy to [Render](https://render.com) or [Railway](https://railway.app).
  - Use the command: `uvicorn api:app --host 0.0.0.0 --port 10000`
- **Frontend:** Deploy to [GitHub Pages](https://pages.github.com).
  - Update `FRONTEND_URL` in your backend `.env` to your GitHub Pages URL.
  - Update `API_BASE` in `portfolio-web/src/App.tsx` to your deployed backend URL.
  - Run `npm run build` and push the `dist` folder to your GitHub repo.
