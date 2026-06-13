# Lumina AI Syllabus Studio

![Lumina Platform Header](https://via.placeholder.com/1200x400/1e1e2e/8b5cf6?text=Lumina+AI+Syllabus+Studio)

> An intelligent course creation and collaborative learning platform with AI-powered content generation and an interactive study companion for teachers and students.

## 🚀 Features

### For Educators
- **AI Course Architect**: Generate complete, structured syllabus outlines using Gemini AI based on topic, difficulty, and duration.
- **AI Lesson Generation**: Auto-generate comprehensive lesson content including objectives, explanations, and markdown formatting.
- **Curriculum Management**: Full CRUD capabilities for courses, modules, and lessons.
- **Student Analytics**: Track student enrollment and quiz performance.

### For Students
- **Course Enrollment**: Discover and enroll in published courses.
- **AI Study Companion**: Chat directly with Gemini AI trained on specific lesson contexts to clarify concepts and answer questions.
- **Auto-graded Quizzes**: Take interactive quizzes with immediate feedback and scoring.
- **Personal Notes**: Keep persistent study notes linked to specific lessons.

## 🛠️ Technology Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Database**: [Turso (LibSQL)](https://turso.tech/) + [Prisma ORM](https://www.prisma.io/)
- **Authentication**: Custom JWT with HTTP-Only Cookies
- **AI Integration**: [Google Generative AI (Gemini)](https://ai.google.dev/)
- **Testing**: [Playwright](https://playwright.dev/) for E2E user flows

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- A Turso account (or local SQLite)
- A Google AI Studio API key (for Gemini)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/vaishnavi-bhusare/house-of-edtech-assignment.git
   cd house-of-edtech-assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root directory based on the `.env.example` structure:
   ```env
   # Database connection (Turso URL or local SQLite file)
   DATABASE_URL="libsql://your-database-name.turso.io"
   DATABASE_AUTH_TOKEN="your-turso-auth-token"
   
   # JWT Secret for authentication
   JWT_SECRET="generate-a-strong-random-string-here"
   
   # Optional: For AI features to work server-side
   GEMINI_API_KEY="your-google-gemini-api-key"
   ```

4. **Initialize Database**
   ```bash
   npx prisma generate
   npx prisma db push
   # Optional: Seed the database with demo users and courses
   npx prisma db seed
   ```

5. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🧪 Running Tests (Playwright)

We use Playwright to ensure the core user flows (authentication, AI curriculum generation, and student enrollment) function correctly.

1. **Install Playwright Browsers**
   ```bash
   npx playwright install --with-deps
   ```

2. **Run E2E Tests**
   ```bash
   npm run test:e2e
   ```

3. **View Test Report**
   ```bash
   npx playwright show-report
   ```

## ☁️ Deployment Guide (Vercel + Turso)

This application is optimized for edge deployment on Vercel.

1. **Database setup**: Create a database on [Turso](https://turso.tech/). Retrieve your `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.
2. **Push code to GitHub**: Ensure your code is hosted on a GitHub repository.
3. **Deploy on Vercel**:
   - Import your repository to Vercel.
   - Configure the Build Command: `npm run build`
   - Set the necessary Environment Variables:
     - `DATABASE_URL`
     - `DATABASE_AUTH_TOKEN`
     - `JWT_SECRET`
     - `GEMINI_API_KEY`
4. **Deploy!** Vercel will automatically build the Next.js app and run Prisma schema generation.

## 🛡️ Security Measures
- Passwords hashed using `bcryptjs`
- Role-based Access Control (RBAC) separating `TEACHER` and `STUDENT` routes
- HTTP-only Secure Cookies for JWT transmission
- React Error Boundaries for application resilience
- Input validation utilizing `Zod` schemas
- Gemini API Endpoint rate-limiting to prevent abuse

---
Developed as part of the House of EdTech full-stack assignment.
