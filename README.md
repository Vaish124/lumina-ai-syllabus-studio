# Lumina AI Syllabus Studio

An intelligent course creation and collaborative learning platform with AI-powered content generation and an interactive study companion for teachers and students.

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

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Turso (LibSQL) + Prisma ORM
- **Authentication**: Custom JWT with HTTP-Only Cookies
- **AI Integration**: Google Generative AI (Gemini)
- **Testing**: Playwright for E2E user flows
- **Deployment**: Vercel + Turso

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- A Turso account (free tier available at [turso.tech](https://turso.tech))
- A Google AI Studio API key (free tier at [ai.google.dev](https://ai.google.dev))
- Git

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/Vaish124/lumina-ai-syllabus-studio.git
cd lumina-ai-syllabus-studio
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in your actual values:

```bash
cp .env.example .env
```

Then edit `.env` and add your credentials:

```env
# Database connection (Turso)
DATABASE_URL="libsql://your-database-name.aws-ap-south-1.turso.io"
DATABASE_AUTH_TOKEN="your-turso-auth-token"

# JWT Secret for authentication (generate a strong random string)
JWT_SECRET="your-super-secret-jwt-key"

# Google Gemini API key (optional, required for AI features)
GEMINI_API_KEY="your-google-gemini-api-key"
```

**⚠️ Important**: Never commit your `.env` file to Git. It's already in `.gitignore`.

#### 4. Initialize database
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Optional: Seed with demo data
npx prisma db seed
```

#### 5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Running Tests

We use Playwright for end-to-end testing of critical user flows including authentication, course creation, AI features, and student enrollment.

#### Install Playwright browsers
```bash
npx playwright install --with-deps
```

#### Run E2E tests
```bash
npm run test:e2e
```

#### View detailed test report
```bash
npx playwright show-report
```

#### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

#### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

## ☁️ Deployment Guide

### Deploy to Vercel

This application is optimized for edge deployment on Vercel.

#### Step 1: Prepare your database
- Create a free database on [Turso](https://turso.tech)
- Copy your `DATABASE_URL` and `DATABASE_AUTH_TOKEN`

#### Step 2: Push code to GitHub
- Ensure your repository is public on GitHub
- Make sure `.env` is in `.gitignore` (already done)

#### Step 3: Deploy on Vercel
1. Go to [Vercel](https://vercel.com)
2. Click "New Project" and import your GitHub repository
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

#### Step 4: Set environment variables
In Vercel project settings, add these environment variables:
- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`
- `JWT_SECRET` (generate a new strong one)
- `GEMINI_API_KEY` (optional for AI features)

#### Step 5: Deploy
Click "Deploy" and Vercel will automatically:
- Build your Next.js application
- Generate Prisma client
- Deploy to edge network

Your app is now live! 🎉

## 🛡️ Security Measures

- ✅ Passwords hashed using bcryptjs
- ✅ Role-based Access Control (RBAC) with TEACHER and STUDENT roles
- ✅ HTTP-only Secure Cookies for JWT transmission
- ✅ React Error Boundaries for application resilience
- ✅ Input validation using Zod schemas
- ✅ Gemini API endpoint rate-limiting to prevent abuse
- ✅ SQL injection prevention via Prisma ORM
- ✅ CORS and security headers configured for production

## 📁 Project Structure

```
lumina-ai-syllabus-studio/
├── src/
│   ├── app/
│   │   ├── actions/          # Server actions (auth, courses, lessons, AI)
│   │   ├── api/              # API routes
│   │   ├── dashboard/        # Protected dashboard routes
│   │   ├── layout.tsx        # Root layout with error boundary
│   │   └── page.tsx          # Landing page
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utilities (auth, Prisma, Gemini)
│   └── styles/               # Global styles
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeding script
├── e2e/                      # Playwright E2E tests
├── .github/workflows/        # GitHub Actions CI/CD
├── .env.example              # Environment variables template
└── playwright.config.ts      # Playwright configuration
```

## 🔑 Key Features in Detail

### Authentication Flow
- Users register with email, name, password, and role (Teacher/Student)
- Passwords hashed with bcryptjs
- JWT tokens stored in HTTP-only cookies
- Token verified on protected routes

### Teacher Workflow
1. Create course with title, description, difficulty, duration, subject
2. AI generates syllabus outline (optional)
3. Create modules within course
4. Add lessons to modules
5. AI generates lesson content (optional)
6. Create quiz questions for lessons
7. Publish course for students

### Student Workflow
1. View available courses
2. Enroll in courses
3. Access lessons in enrolled courses
4. Take quizzes with immediate auto-grading
5. Chat with AI study companion for lesson clarification
6. Create personal study notes

### AI Features
- **Syllabus Generation**: Gemini generates course structure based on topic
- **Lesson Content**: Gemini creates detailed markdown lesson content
- **Study Assistant**: Context-aware chat based on lesson content

## 🧑‍💻 Development Tips

### Making Database Changes
```bash
# Edit prisma/schema.prisma
# Then push changes
npx prisma db push

# Generate client types
npx prisma generate
```

### Debugging
- Check server logs: `npm run dev` console
- Check browser console for client errors
- Use Prisma Studio: `npx prisma studio`

### Adding new features
1. Update Prisma schema if needed
2. Create server action in `src/app/actions/`
3. Create/update component in `src/components/`
4. Add E2E test in `e2e/`

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Turso Documentation](https://docs.turso.tech)
- [Google Generative AI](https://ai.google.dev)
- [Playwright Testing](https://playwright.dev)

## 📝 Assignment Information

This project is submitted as part of the **House of Edtech Fullstack Developer Assignment**.

- **Developer**: Vaishnavi Bhusare
- **GitHub**: https://github.com/Vaish124/lumina-ai-syllabus-studio
- **LinkedIn**: https://www.linkedin.com/in/vaishnavi-bhusare-37243936a/
- **Duration**: Full-stack development project
- **Tech Stack**: Next.js 16, TypeScript, Tailwind CSS, Prisma, Google Gemini AI

## 📄 License

This project is open source and available under the MIT License.

---

**Ready to get started?** Follow the [Getting Started](#-getting-started) section above!
