# 🎓 CGU Copilot UI

An AI-powered chatbot interface for **Claremont Graduate University (CGU)**, built with Next.js and powered by the [Dify](https://dify.ai) API. Students can ask questions about programs, admissions, tuition, and more.

## 📁 Project Structure

This project is designed to be easily modifiable. Here are the key files you might want to touch:

### 1. **`app/globals.css`** (Styling & Theme)
- Change the **brand color** by modifying the `--primary` and `--ring` variables.
- Currently set to **CGU Red** (`#af1d27`).

### 2. **`components/suggestion-cards.tsx`** (UI Content)
- Modify the `suggestions` array to change the **suggestion cards** on the welcome screen.
- You can update the `icon`, `title`, `subtitle`, and the `query` sent to the AI.

### 3. **`components/thinking-steps.tsx`** (AI Logic Visualization)
- Controls how the AI's "thinking process" is displayed.
- Modify this if you want to change how tools or observations are rendered.

### 4. **`app/page.tsx`** (Main Logic)
- The core chat interface.
- Handles message state, streaming responses, and file uploads.

### 5. **`app/api/`** (Backend Proxies)
- `chat/route.ts`: Proxies chat requests to Dify (handles streaming).
- `upload/route.ts`: Handles file uploads to Dify.
- `feedback/route.ts`: Submits user feedback (likes/dislikes).

## 🚀 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment**:
    
    Create environment file:
    ```bash
    cp .env.example .env.local
    ```

    Edit `.env.local` with your configuration:
    ```env
    DIFY_API_BASE_URL=https://your-dify-instance/v1
    DIFY_API_KEY=your-api-key-here
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Build for Production**:
    ```bash
    npm run build
    npm start
    ```

## ☁️ Deployment (Vercel)

The easiest way to deploy this project is via [Vercel](https://vercel.com).

1.  **Push your code** to GitHub/GitLab/Bitbucket.
2.  **Import the project** into Vercel.
3.  **Configure Environment Variables** in the Vercel dashboard:
    - `DIFY_API_BASE_URL`: Your Dify instance URL.
    - `DIFY_API_KEY`: Your Dify API key.
4.  **Click Deploy**.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript, React 19
- **Styling**: Tailwind CSS 4
- **AI Backend**: Dify API