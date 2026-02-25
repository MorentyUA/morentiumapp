# React Telegram Mini App (TWA)

A premium Telegram Web App (TWA) built with Vite, React, TypeScript, and Tailwind CSS. Featuring dark mode glassmorphism UI, smooth Framer Motion animations, and built-in Admin management.

## Features
- **Responsive Navigation**: 2-Level deeply integrated navigation using Telegram's BackButton API.
- **Premium UI**: Framer motion transitions, glass cards, dynamic shimmer loading effects.
- **Admin Panel**: Floating UI to add, edit, or delete categories and content links directly from within the app.
- **Content Types**: Supports embedded Youtube Videos, External Links (with "Open Link" integration), and rich text blocks.

## Development Setup

1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```

## Deploying to Vercel

1. Push your code to GitHub.
2. Connect the repository to Vercel.
3. Vercel will automatically detect Vite and configure the build settings.
4. The included `vercel.json` ensures frontend SPA routing works properly.

## Connecting to @BotFather

To make this app available as a Telegram Mini App:

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Type `/newbot` and follow the instructions to create your bot.
3. Type `/newapp` and select the bot you just created.
4. Follow the instructions to provide a Title, Description, and an icon.
5. When asked for the **Web App URL**, provide the `https://...` URL where you deployed the app (e.g., your Vercel URL).
6. Give your Web App a short name.
7. You will receive a direct link to your Mini App: `t.me/your_bot_name/app_name`.

## Admin Flow

To test the Admin mode in a web browser without Telegram:
- Open `src/types.ts` and ensure `ADMIN_ID` matches your Telegram User ID.
- In `src/App.tsx`, the fallback logic ensures that the Panel is visible if not in the Telegram environment for testing purposes.
