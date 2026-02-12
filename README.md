# Dalil (دليل)

Dalil is a modern, educational platform designed for algorithms and competitive programming. It provides a structured roadmap, interactive algorithm visualizations, benchmarks, and a competitive environment for learners in both Arabic and English.

## 🚀 Features

- **Interactive Roadmaps**: Structured, tier-based learning paths (Beginner, Intermediate, Advanced) that guide users through the world of competitive programming.
- **Algorithm Explorer**: A comprehensive library of algorithms with detailed explanations (Arabic/English), prerequisites, and curated practice problems.
- **User Dashboard**: Professional analytics featuring:
  - **Activity Heatmap**: Visual tracking of solving consistency.
  - **Streak System**: Motivational daily activity tracking.
  - **Progress Metrics**: Real-time stats on completed algorithms and solved problems.
- **Competitive Environment**:
  - **Leaderboards**: Multiple ranking categories including Weekly Streaks, Improvement, and General Ranking.
  - **Level Badges**: Distinctive badges reflected based on user progress and points.
- **Admin Portal**: Fully integrated management system for:
  - **Roadmap Builder**: Dynamic control over learning paths.
  - **Assessment Manager**: Question bank and cognitive test management.
  - **Resource Catalog**: Curation of external video and article resources.
- **Bilingual Core**: Seamless RTL/LTR support for Arabic and English across all interfaces.

## ✨ Abilities

With Dalil, you can:
- **Systematic Learning**: Transition from a beginner to an advanced problem solver using verified resources.
- **Track Growth**: Visualize your journey through detailed metrics and community rankings.
- **Master Algorithms**: Access high-quality educational content tailored for the Arab community.
- **Compete & Thrive**: Join a network of developers, participate in challenges, and earn professional badges.
- **Identify Strengths**: Use integrated assessments to understand your logical thinking capabilities.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend & Auth**: Supabase
- **State Management**: TanStack Query (React Query)
- **Internationalization**: i18next (Custom Context Implementation)
- **Charts & Data**: Recharts, Lucide Icons

## 📁 Project Structure

```text
src/
├── components/     # Reusable UI and feature-specific components
├── contexts/       # React contexts (e.g., Auth, i18n)
├── hooks/          # Custom React hooks
├── i18n/           # Internationalization logic
├── lib/            # External library configurations (Supabase, etc.)
├── pages/          # Application routes/pages
└── utils/          # Helper functions
```

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun

### Installation

1. **Clone the repository**:
   ```sh
   git clone <YOUR_GIT_URL>
   cd dalil-react
   ```

2. **Install dependencies**:
   ```sh
   npm install
   # or
   bun install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**:
   ```sh
   npm run dev
   ```

## 🌐 Localization

The app uses a custom i18n implementation. Translation files are located in `public/assets/i18n/`.
- `ar.json`: Arabic translations
- `en.json`: English translations

## 📄 License

This project is private and for internal use.
