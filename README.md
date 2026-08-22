# WriteAbout

> A dynamic, timed image-description practice application designed to test and improve your descriptive fluency, powered by Groq.

---

## Executive Summary
**WriteAbout** is an interactive web application built to enhance creative writing and observational skills. Users are presented with a random, high-quality image and given exactly 60 seconds to write a detailed, compelling description. Upon submission, the text is evaluated by Groq, scoring the user's performance and providing actionable, real-time feedback. 

To help users track their growth, WriteAbout includes a fully functional **Insights Dashboard** that beautifully visualizes API usage and historical performance trends over time using modern data visualization techniques.

## Key Features
- **Timed Challenges**: A strict 60-second countdown timer pushes users to think quickly and write efficiently.
- **AI-Powered Feedback**: Integrates securely with the Groq API to grade submissions (Low, Medium, Good, High, Excellent) and provide concise feedback (100-150 tokens max).
- **Interactive Insights Dashboard**: Features beautiful, responsive charts (via Recharts) displaying 7-day API usage and a monthly performance breakdown.
- **Automated Data Sweeping**: Built-in data retention logic automatically cleans the Postgres database (deleting practices older than 1 month and API logs older than 1 week) to maintain optimal performance and storage.
- **Premium Glassmorphism Design**: A stunning, modern UI built with custom CSS, featuring pastel gradients, soft shadows, and fully responsive layouts.

## Technology Stack
- **Frontend**: Next.js 14, React, Recharts
- **Styling**: Vanilla CSS (Custom Glassmorphism Design System)
- **Database**: Postgres (Neon integration)
- **AI Integration**: Groq API (`https://api.groq.com/openai/v1/models`)

---

## How to Host on Vercel

WriteAbout is built on Next.js, meaning it is perfectly optimized for one-click deployment on Vercel.

### Step 1: Push to GitHub
1. Ensure your `.env.example` is pushed to GitHub (it serves as a reference for required variables).
2. Push your repository to GitHub.

### Step 2: Deploy to Vercel
1. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Import your GitHub repository.
3. In the **Environment Variables** section during setup, reference your `.env.example` and add the following variables:
   - `NEXT_PUBLIC_APP_PASSWORD`: (Choose your secure login password)
   - `GROQ_API_KEY`: (Your Groq API key)
   - `GROQ_MODEL_NAME`: qwen/qwen3.6-27b
4. Click **Deploy**.

### Step 3: Setup the Neon Postgres Database
1. Once deployed, navigate to the **Marketplace** (or **Storage** tab) in your Vercel project dashboard.
2. Install **Neon Postgres** and link it to your project.
3. Vercel will automatically inject the `POSTGRES_URL` into your environment variables.
4. Go to your live Vercel URL and append `/api/init-db` to the end of the URL (e.g., `https://your-app.vercel.app/api/init-db`).
5. This will trigger the secure setup script to instantly create your database tables! 

You are now ready to log in and start practicing!
