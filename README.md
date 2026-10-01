# Vaartaa - WhatsApp Business API Platform

Vaartaa is a full-stack SaaS platform for marketing, sales, and support via the official WhatsApp Business API. It includes a marketing website and an authenticated dashboard.

## Tech Stack
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** NestJS (Node.js REST API)
- **Database:** Supabase (PostgreSQL)
- **Queue:** Redis + BullMQ (for outbound WhatsApp message sending)
- **Deployment:** Docker Compose

## Quick Start

### 1. Prerequisites
- Docker and Docker Compose installed.
- Node.js >= 18 (if running locally without Docker).

### 2. Environment Setup

Create a `.env` file in the root directory and copy the contents of `.env.example` (you'll need to create this based on your Supabase and Meta setup).

### 3. Running with Docker Compose

To start the entire stack (Frontend, Backend, Redis):
```bash
docker-compose up --build
```
- Frontend will run on `http://localhost:3001`
- Backend will run on `http://localhost:3000`
- Redis will run on `localhost:6379`

## Adding Real Credentials

### Meta WhatsApp Cloud API
The WhatsApp integration is stubbed behind a `WhatsAppService` adapter in the backend. 
When real credentials are available, update the `.env` file with `META_APP_ID`, `META_APP_SECRET`, `WHATSAPP_TOKEN`, and `WHATSAPP_PHONE_NUMBER_ID`. 

### PSP (Payments)
Payment integrations are stubbed. To add real PSPs (Razorpay, PayU), update the payment adapters with the respective SDK credentials in the `.env` file.

## Supabase Manual Configuration

Because Vaartaa relies on Supabase Auth for its password reset flow, you **must** configure the following settings in your Supabase project dashboard (these cannot be set from application code):

1. **Redirect URLs (CRITICAL):**
   - Navigate to **Authentication → URL Configuration**.
   - Add your application's reset password URL (e.g., `http://localhost:3000/auth/reset-password` and your production URL) to the **Redirect URLs** list. 
   - *If this is missing, Supabase will refuse to redirect the user back to the app and the reset flow will fail silently.*

2. **Email Templates:**
   - Navigate to **Authentication → Email Templates → Reset Password**.
   - Customize the email subject and body to match Vaartaa's branding instead of the generic Supabase default copy.

3. **Rate Limiting:**
   - Supabase has built-in rate limits for password reset requests per email/IP.
   - Confirm these limits under **Authentication → Rate Limits** are appropriate for your production use case.
