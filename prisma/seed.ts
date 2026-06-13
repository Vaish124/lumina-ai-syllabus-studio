import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({
  url: databaseUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.userProgress.deleteMany({});
  await prisma.studyNote.deleteMany({});
  await prisma.quizAttempt.deleteMany({});
  await prisma.quizQuestion.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.module.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.user.deleteMany({});

  // Create Users
  const passwordHash = await bcrypt.hash("password123", 10);

  const teacher = await prisma.user.create({
    data: {
      email: "teacher@edtech.com",
      password: passwordHash,
      name: "Dr. Jane Smith (Teacher)",
      role: "TEACHER",
    },
  });

  const student = await prisma.user.create({
    data: {
      email: "student@edtech.com",
      password: passwordHash,
      name: "Alex Mercer (Student)",
      role: "STUDENT",
    },
  });

  console.log("Users created:", { teacher: teacher.email, student: student.email });

  // Create a Course
  const course = await prisma.course.create({
    data: {
      title: "Introduction to Artificial Intelligence",
      description: "Learn the core concepts of Artificial Intelligence, including Machine Learning, Neural Networks, and modern Large Language Models.",
      difficulty: "Intermediate",
      duration: "4 weeks",
      subject: "Computer Science",
      published: true,
      authorId: teacher.id,
    },
  });

  // Create Modules
  const module1 = await prisma.module.create({
    data: {
      title: "Module 1: AI Foundations",
      description: "Introduction to the history, definition, and basic concepts of AI.",
      order: 1,
      courseId: course.id,
    },
  });

  const module2 = await prisma.module.create({
    data: {
      title: "Module 2: Machine Learning Deep Dive",
      description: "Supervised vs. Unsupervised learning and basic regression models.",
      order: 2,
      courseId: course.id,
    },
  });

  // Create Lessons for Module 1
  const lesson1 = await prisma.lesson.create({
    data: {
      title: "What is Artificial Intelligence?",
      content: `# What is Artificial Intelligence?

Welcome to your first lesson in AI foundations! 

## Definition of AI
Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think like humans and mimic their actions. The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving.

## Brief History of AI
- **1950**: Alan Turing publishes "Computing Machinery and Intelligence," introducing the Turing Test.
- **1956**: John McCarthy coins the term "Artificial Intelligence" at the Dartmouth Conference.
- **1997**: IBM's Deep Blue defeats world chess champion Garry Kasparov.
- **2012**: Deep learning breakthroughs revive neural network research.
- **2022+**: Large Language Models (LLMs) like GPT and Gemini achieve widespread consumer adoption.

## Types of AI
1. **Narrow AI (Weak AI)**: AI designed and trained for a particular task (e.g., facial recognition, search engine recommendations). All current AI is Narrow AI.
2. **General AI (Strong AI)**: AI with cognitive abilities similar to a human, capable of finding a solution to unfamiliar tasks. This remains theoretical.
3. **Super AI**: AI that exceeds human intelligence across all fields. This also remains theoretical.

## Conclusion
AI is rapidly changing our world. By understanding its history and core categories, you are prepared to explore how machines learn from data.`,
      objectives: JSON.stringify([
        "Define what Artificial Intelligence is.",
        "List key milestones in the history of AI.",
        "Differentiate between Narrow AI and General AI."
      ]),
      order: 1,
      moduleId: module1.id,
    },
  });

  const lesson2 = await prisma.lesson.create({
    data: {
      title: "Understanding Turing Tests and Rational Agents",
      content: `# Turing Tests & Rational Agents

Now that we know what AI is, let's explore how we measure intelligence and design AI architectures.

## The Turing Test
Proposed by Alan Turing in 1950, this test assesses a machine's ability to exhibit intelligent behavior equivalent to, or indistinguishable from, that of a human.

- **Setup**: A human evaluator chats with a human and a machine through text interfaces.
- **Goal**: The evaluator must decide which participant is the machine.
- **Result**: If the evaluator cannot reliably tell the difference, the machine is said to have passed the test.

## Rational Agents
In modern AI textbooks (like Russell & Norvig), AI is defined as the study of **rational agents**.
*   **Agent**: Anything that can be viewed as perceiving its environment through sensors and acting upon that environment through actuators.
*   **Rational Agent**: An agent that acts so as to achieve the best outcome or, when there is uncertainty, the best expected outcome.

## The PEAS Description
To design a rational agent, we must specify its **PEAS**:
1. **P**erformance Measure: The metric to evaluate the agent's success.
2. **E**nvironment: The world in which the agent operates.
3. **A**ctuators: The tools the agent uses to perform actions.
4. **S**ensors: The tools the agent uses to perceive the environment.

### Example: Automated Taxi
*   **Performance**: Safety, speed, comfort, legal driving.
*   **Environment**: Roads, traffic, pedestrians, weather.
*   **Actuators**: Steering, accelerator, brakes, horn.
*   **Sensors**: Cameras, LiDAR, speedometer, GPS.`,
      objectives: JSON.stringify([
        "Explain the Turing Test and its setup.",
        "Define a Rational Agent.",
        "Construct a PEAS description for any autonomous system."
      ]),
      order: 2,
      moduleId: module1.id,
    },
  });

  // Create Quizzes for Lesson 1
  await prisma.quizQuestion.create({
    data: {
      question: "Who coined the term 'Artificial Intelligence' in 1956?",
      options: JSON.stringify([
        "Alan Turing",
        "John McCarthy",
        "Elon Musk",
        "Ada Lovelace"
      ]),
      correctAnswer: "John McCarthy",
      explanation: "John McCarthy coined the term in 1956 at the Dartmouth Summer Research Project on Artificial Intelligence.",
      lessonId: lesson1.id,
    },
  });

  await prisma.quizQuestion.create({
    data: {
      question: "What category does all modern, active AI fall into?",
      options: JSON.stringify([
        "General AI",
        "Super AI",
        "Narrow AI",
        "Quantum AI"
      ]),
      correctAnswer: "Narrow AI",
      explanation: "All current AI systems, including LLMs, are considered Narrow (or Weak) AI because they are designed for specific tasks rather than possessing general human consciousness.",
      lessonId: lesson1.id,
    },
  });

  // Create Quizzes for Lesson 2
  await prisma.quizQuestion.create({
    data: {
      question: "What does the 'P' in the PEAS agent description stand for?",
      options: JSON.stringify([
        "Process",
        "Programming",
        "Performance Measure",
        "Perception"
      ]),
      correctAnswer: "Performance Measure",
      explanation: "PEAS stands for Performance Measure, Environment, Actuators, and Sensors.",
      lessonId: lesson2.id,
    },
  });

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
