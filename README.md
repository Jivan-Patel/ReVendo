# ReVendo 🛍️

> **A modern full-stack second-hand marketplace mobile application built with React Native (Expo), Node.js, Express, and MongoDB.**

[![React Native](https://img.shields.io/badge/React_Native-0.88.1-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_58-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_8-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🌟 Overview

**ReVendo** is a community-driven peer-to-peer marketplace that empowers users to buy and sell pre-loved goods locally with transparency, speed, and trust. 

Designed for both performance and user experience, ReVendo features instant keyword search, category filtering, interactive price negotiations, live in-app messaging, multi-image product carousels, and geolocation-based distance discovery — all formatted in Indian Rupee (**₹**).

---

## ✨ Features

- **📸 Multi-Image Listings & Sharp Optimization**: Upload multiple photos per listing. High-resolution images are automatically resized and compressed on the backend using `sharp` to provide fast load times and optimized thumbnails.
- **🏷️ Product Condition Classification**: Tag listings with conditions (*New*, *Like New*, *Good*, *Fair*) styled with distinctive color-coded pill badges.
- **📍 Geolocation Distance Calculation**: Automatically calculates the distance (in km) between the buyer's current location and the seller's listing coordinates using the Haversine formula.
- **💬 Real-Time Chat & Polling**: Direct two-way messaging between buyer and seller with message bubble UI, automatic background polling, and Expo push notifications.
- **🤝 Price Negotiation & Offer System**: Send formal price offers, respond with counter-offers, or accept/reject proposals with real-time status transitions.
- **❤️ Wishlist & Persistent Favorites**: Save items to a dedicated wishlist stored persistently across sessions.
- **👁️ Recently Viewed History**: Convenient carousel on the home feed showing items the user recently inspected.
- **👤 Dynamic Profile & Avatar Generator**: Upload a custom profile picture or automatically generate colored avatars based on the user's initials.
- **🔒 Secure Authentication**: JSON Web Token (JWT) based session storage with password hashing using `bcryptjs`.
- **🇮🇳 Localized Experience**: Standardized Indian Rupee (**₹**) currency notation across all feeds, search screens, details screens, and offer dialogs.

---

## 🏗️ Architecture & Tech Stack

```
ReVendo/
├── backend/                  # RESTful API Server
│   ├── src/
│   │   ├── middleware/       # JWT Auth, Sharp Image Resizing, Error Handling
│   │   ├── models/           # Mongoose Schemas (User, Listing, Message, Offer, Wishlist)
│   │   ├── routes/           # Express Route Handlers
│   │   └── services/         # Push Notification Delivery Service
│   ├── uploads/              # Uploaded Images & Processed Thumbnails
│   ├── seed.js               # Initial Database Seeder
│   └── server.js             # Express Server Entry Point
│
└── client/                   # React Native Mobile App (Expo)
    ├── src/
    │   ├── api/              # Apisauce HTTP Client & API Endpoints
    │   ├── auth/             # Secure JWT Storage & Context
    │   ├── components/       # Custom Reusable UI Components
    │   ├── config/           # Colors, Categories, Condition Badges
    │   ├── hooks/            # useLocation, useNotifications, useApi
    │   ├── navigation/       # React Navigation (Feed, Account, Chat, Tabs)
    │   ├── screens/          # App Screen Views
    │   └── utility/          # Distance Math, Cache, Storage
    └── App.js                # Root Application Component
```

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB via Mongoose ODM
- **Media Processing**: Multer + Sharp
- **Security & Validation**: Helmet, CORS, Joi, bcryptjs, jsonwebtoken

### Frontend
- **Framework**: React Native with Expo SDK 58
- **Navigation**: React Navigation v6 (Native Stack, Bottom Tabs)
- **Networking**: Apisauce & Axios (auto-detects host machine IP for physical device testing)
- **Forms**: Formik & Yup
- **Icons**: Expo Vector Icons (`MaterialCommunityIcons`)
- **Storage**: `@react-native-async-storage/async-storage`

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (local daemon or free MongoDB Atlas connection string)
- [Expo Go](https://expo.dev/go) app installed on your physical mobile device (or an Android/iOS emulator)

---

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment configuration
# Verify .env settings:
# PORT=9000
# MONGODB_URI=mongodb://127.0.0.1:27017/revendo (or Atlas URI)
# JWT_SECRET=revendo_jwt_secret_key_2026_super_secure
# BASE_URL=http://localhost:9000

# Seed demo users, categories, and sample listings
npm run seed

# Start server in development mode (with nodemon)
npm run dev
```

The backend server will run at `http://localhost:9000`.

#### Seed Test Accounts
The database seeder provisions ready-to-test accounts:
- **Admin**: `admin@gmail.com` | Password: `12345`
- **User**: `aarav@revendo.com` | Password: `12345`

---

### 2. Mobile Client Setup

```bash
cd client

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

- **Physical Device**: Scan the QR code displayed in the terminal using the Expo Go app (ensure your phone and computer are on the same Wi-Fi network). The client automatically resolves your local network IP address (`Constants.expoConfig.hostUri`).
- **Android Emulator**: Press `a` in the terminal.
- **iOS Simulator**: Press `i` in the terminal.
- **Web Preview**: Press `w` in the terminal.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `POST` | `/api/auth` | User login (returns JWT token) | ❌ |
| `POST` | `/api/users` | Register a new user | ❌ |
| `PUT` | `/api/users/profile` | Update profile information | ✅ (`x-auth-token`) |
| `GET` | `/api/listings` | Fetch public listings (search & category filters) | ❌ |
| `POST` | `/api/listings` | Upload new listing with photos (`multipart/form-data`) | ✅ (`x-auth-token`) |
| `PUT` | `/api/listings/:id` | Update listing details or photos | ✅ (`x-auth-token`) |
| `DELETE` | `/api/listings/:id` | Delete listing and remove stored image files | ✅ (`x-auth-token`) |
| `GET` | `/api/my/listings` | Retrieve listings posted by authenticated user | ✅ (`x-auth-token`) |
| `POST` | `/api/offers` | Submit a price offer | ✅ (`x-auth-token`) |
| `GET` | `/api/offers` | Retrieve received and sent offers | ✅ (`x-auth-token`) |
| `PATCH` | `/api/offers/:id` | Accept or reject an offer | ✅ (`x-auth-token`) |
| `POST` | `/api/messages` | Send chat message and trigger push notification | ✅ (`x-auth-token`) |
| `GET` | `/api/messages/conversations` | Fetch conversations inbox | ✅ (`x-auth-token`) |
| `GET` | `/api/messages/thread/:listingId/:otherUserId` | Load two-way chat thread | ✅ (`x-auth-token`) |
| `POST` | `/api/expoPushTokens` | Register push notification token | ✅ (`x-auth-token`) |
| `GET` | `/api/health` | Health check endpoint | ❌ |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
