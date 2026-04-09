# Campus Book Marketplace

Full-stack web app for college students to buy/sell books safely inside campus.

## Stack
- Frontend: HTML, Tailwind CSS, Vanilla JavaScript
- Backend: Node.js, Express.js (MVC)
- Database: MongoDB with Mongoose
- Auth: JWT + bcrypt password hashing
- Uploads: Multer (college ID cards + book images)

## Folder Structure
- `frontend/` - static pages + client JS
- `backend/` - API server (`controllers`, `models`, `routes`, `middleware`, `utils`)

## Features Implemented
- User registration/login (`@college.edu` validation)
- Role system (`buyer`, `seller`, `admin`)
- Seller verification request (ID card upload or college email path)
- Admin panel API to approve/reject seller requests
- Verified sellers can add/edit/delete books
- Search and backend filtering (title, branch, semester, min/max price)
- Buy flow:
  - WhatsApp "Contact Seller" button
  - Order request API (buyer sends, seller accepts/rejects)
- Optional rating system (1-5 stars) with average rating
- Responsive UI, loading states, toast notifications
- Error handling middleware and input validation

## Local Setup

### 1) Backend
1. Go to backend:
   - `cd backend`
2. Install dependencies:
   - `npm install`
3. Create `.env` from `.env.example` and edit values:
   - `PORT=5000`
   - `MONGO_URI=mongodb://127.0.0.1:27017/campus_book_marketplace`
   - `JWT_SECRET=replace_with_strong_secret`
   - `ADMIN_EMAIL=admin@college.edu`
   - `ADMIN_PASSWORD=admin123`
4. Start server:
   - `npm start`

The backend auto-creates a default admin account using `ADMIN_EMAIL`/`ADMIN_PASSWORD` if it does not exist.

### 2) Frontend
**Recommended:** with the backend running, open **`http://localhost:5000/`** in the browser. Express serves the `frontend/` folder, so API calls use the same origin and avoid “Failed to fetch” from `file://` pages.

You can still open `frontend/*.html` directly if you prefer; in that case the script falls back to `http://localhost:5000/api` (the server must be running).

## Important Frontend Pages
- `index.html` - marketplace with search/filter
- `register.html` - student registration
- `login.html` - login
- `dashboard.html` - profile, verification request, add listing, orders, rating
- `admin.html` - admin verification approvals

## REST API Overview
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- User:
  - `GET /api/users/me`
- Seller:
  - `POST /api/seller/request-verification` (multipart, `idCardImage`)
- Books:
  - `GET /api/books`
  - `GET /api/books/seller/:sellerId`
  - `POST /api/books` (verified seller)
  - `PUT /api/books/:id`
  - `DELETE /api/books/:id`
- Orders:
  - `POST /api/orders`
  - `GET /api/orders/my`
  - `PATCH /api/orders/:id/status`
- Ratings:
  - `POST /api/ratings`
- Admin:
  - `GET /api/admin/dashboard`
  - `PATCH /api/admin/verification/:id`
