# Full Stack Web App (Next.js + Prisma + Auth + Vercel Ready)
A modern full-stack web application built with **Next.js**, **Prisma ORM**, **Neon PostgreSQL**, and **NextAuth-style authentication**, fully deployed and optimized for production on Vercel.
This project includes authentication, database integration, admin capabilities, and a scalable architecture suitable for SaaS applications.
---
link : https://small-business-booking-system.vercel.app/
## 🚀 Tech Stack
- **Frontend:** Next.js (App Router)
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Authentication:** NextAuth (session-based)
- **Deployment:** Vercel
- **Runtime:** Node.js (server functions)
---
## ✨ Features
### 🔐 Authentication System
- Secure login system
- Session-based authentication
- Production-safe cookie handling
- Environment-aware configuration (local + production)
- Protected API routes
### 🗄️ Database
- PostgreSQL via Neon
- Prisma ORM integration
- Type-safe database queries
- Migrations support
### ⚙️ Admin System
- Admin login access
- Protected routes
- Settings management API
### 🌐 Production Ready
- Fully deployed on Vercel
- Environment variable configuration
- Secure production cookies
- Node.js runtime enforced for auth routes
---
## 📦 Project Structure

src/
├── app/
│    ├── api/
│    │    └── auth/
│    │         └── […nextauth]/
│    ├── admin/
│    └── (frontend pages)
│
├── lib/
│    └── auth.ts
│    └── prisma.ts
│
├── prisma/
│    └── schema.prisma

---
## 🔐 Environment Variables
Create a `.env.local` file for local development:
```env
DATABASE_URL=your_neon_database_url
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key

⸻

Production (Vercel)

Set these in Vercel Dashboard:

* DATABASE_URL
* NEXTAUTH_URL
* NEXTAUTH_SECRET

⸻

🧪 Running Locally

1. Install dependencies

npm install

2. Run database migrations

npx prisma generate
npx prisma db push

3. Start development server

npm run dev

App runs on:

http://localhost:3000

⸻

🏗️ Build for Production

npm run build
npm start

⸻

🚀 Deployment (Vercel)

1. Push repository to GitHub
2. Import project into Vercel
3. Add environment variables:
    * DATABASE_URL
    * NEXTAUTH_URL
    * NEXTAUTH_SECRET
4. Deploy

⸻

🔐 Authentication Notes

* Uses environment-aware cookie handling
* Secure cookies enabled in production only
* Node.js runtime enforced for auth routes
* Session persistence via NextAuth strategy

⸻

⚠️ Known Constraints

* Requires correct environment variables to function
* Database must be reachable from production (Neon recommended)
* Auth will fail silently if NEXTAUTH_URL is incorrect

⸻

🧠 Lessons Learned (Important)

This project includes production fixes for:

* Vercel environment variable mismatch
* NextAuth cookie security issues
* Edge runtime incompatibility with Prisma
* Local vs production authentication divergence

⸻

📈 Future Improvements

* Role-based access control (RBAC)
* Rate limiting on auth routes
* Email verification system
* Audit logging
* API security hardening
* Analytics integration (PostHog / Vercel Analytics)

⸻

Author

Raphael Ngoy Full-Stack Developer (Aspiring Freelancer)

📜 License

This project is for portfolio/learning/demo purposes only.

