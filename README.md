# AI Teaching Assistant

AI Teaching Assistant is a web-based classroom support dashboard built with Next.js, TypeScript, React, OpenAI, and Recharts. The project helps instructors review student engagement, generate AI-supported insights, grade student responses, detect possible AI-assisted writing, create quizzes, generate lesson plans, and design classroom activities.

## Features

- Student analytics dashboard with upload activity and risk breakdown
- AI-generated class engagement insights
- AI grading for student answers with feedback and reasoning
- AI writing detection with flagged sections and recommendations
- Quiz generator from a topic
- Quiz generator from uploaded PDF, PPT, PPTX, or TXT files
- Lesson plan generator for course planning
- Classroom activity generator for active learning

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- OpenAI API
- Recharts
- Zod
- JSZip
- pdf-parse

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/anngelaroy/ai-teaching-assistant.git
cd ai-teaching-assistant
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Create a `.env.local` file in the project root and add your own OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

Do not commit `.env.local` to GitHub.

### 4. Run the development server

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
```

Runs the project locally.

```bash
npm run build
```

Builds the project for production.

```bash
npm run start
```

Starts the production build.

```bash
npm run lint
```

Runs linting checks.

## Project Notes

The analytics dashboard currently uses sample student data for demonstration purposes. In a production version, this could be connected to a real database such as Supabase, Firebase, PostgreSQL, Prisma, or another student data source.

## Responsible AI Note

This tool is designed to support instructors, not replace human judgment. AI-generated grading, feedback, lesson plans, quiz content, and AI-detection results should be reviewed by an instructor before being used for academic or classroom decisions.

## Contributors

- Anngela Roy
- Majeed Khan
- Shirvani Tapkeer

## Future Improvements

- Connect the dashboard to a real database
- Add authentication for instructors
- Add course and student management
- Add export options for quizzes, lesson plans, and grading feedback
- Add screenshots and demo walkthrough
- Improve error handling for OpenAI API failures
