# ReVendo Backend API

Express & MongoDB Backend API powering **ReVendo — best overall marketplace identity.**

---

## Prerequisites
1. **Node.js** (v18+)
2. **MongoDB** (Local MongoDB instance or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster)

---

## Setup & Configuration

1. **Environment Variables**:
   A `.env` file is located in this directory:
   ```env
   PORT=9000
   MONGODB_URI=mongodb://127.0.0.1:27017/revendo
   JWT_SECRET=revendo_jwt_secret_key_2026_super_secure
   BASE_URL=http://localhost:9000
   ```
   *If using MongoDB Atlas, replace `MONGODB_URI` with your connection string:*
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/revendo?retryWrites=true&w=majority
   ```

2. **Seed Initial Data**:
   Pre-populates sample categories, test listings, and a demo user account:
   ```bash
   npm run seed
   ```
   **Default Test Account created by seed:**
   - Email: `admin@gmail.com`
   - Password: `12345`

3. **Start the API Server**:
   ```bash
   # Development mode with nodemon auto-reload:
   npm run dev

   # Or standard production mode:
   npm start
   ```
   The API will start on **`http://localhost:9000/api`**.

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth` | User login (returns JWT) | No |
| `POST` | `/api/users` | Register new user | No |
| `PUT` | `/api/users/profile` | Update profile (avatar, bio, phone) | **Yes** (`x-auth-token`) |
| `GET` | `/api/listings` | Fetch public listings (search, filter, near-me) | No |
| `POST` | `/api/listings` | Upload listing with images (`multipart/form-data`) | **Yes** (`x-auth-token`) |
| `PUT` | `/api/listings/:id` | Edit listing & manage photos | **Yes** (`x-auth-token`) |
| `DELETE` | `/api/listings/:id` | Delete listing & image assets | **Yes** (`x-auth-token`) |
| `GET` | `/api/my/listings` | Fetch current user's listings | **Yes** (`x-auth-token`) |
| `POST` | `/api/offers` | Make a price offer | **Yes** (`x-auth-token`) |
| `GET` | `/api/offers` | Fetch received & sent offers | **Yes** (`x-auth-token`) |
| `PATCH` | `/api/offers/:id` | Accept or reject offer | **Yes** (`x-auth-token`) |
| `POST` | `/api/messages` | Send message & push notification | **Yes** (`x-auth-token`) |
| `GET` | `/api/messages/conversations`| Fetch conversations inbox | **Yes** (`x-auth-token`) |
| `GET` | `/api/messages/thread/:listingId/:otherUserId` | Two-way chat thread | **Yes** (`x-auth-token`) |
| `POST` | `/api/expoPushTokens` | Register Expo push token | **Yes** (`x-auth-token`) |
| `GET` | `/api/health` | Server health check | No |
| `GET` | `/uploads/:filename` | Static image files & thumbnails | No |
