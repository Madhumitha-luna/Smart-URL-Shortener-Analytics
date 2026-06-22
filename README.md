# Smart URL Shortener with Analytics Dashboard

## Overview

Smart URL Shortener is a full-stack web application that allows users to create shortened URLs, manage their links, and track detailed analytics. The platform provides authentication, URL management, click tracking, and analytics insights through an intuitive dashboard.

---

## Features

### Authentication
- User Signup
- User Login
- Protected Routes
- User-specific URL Management

### URL Shortening
- Generate unique short URLs
- Redirect short URLs to original URLs
- URL Validation
- Copy-to-Clipboard Support

### Dashboard
- View all created URLs
- Original URL
- Short URL
- Creation Date
- Total Click Count
- Delete URLs

### Analytics
- Track URL Clicks
- Record Visit Timestamps
- Total Click Count
- Last Visited Time
- Recent Visit History

### Bonus Features
- QR Code Generation
- Custom URL Alias
- Responsive UI
- Form Validation
- Error Handling

---

## Technology Stack

### Frontend
- React.js

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Additional Libraries
- JWT Authentication
- bcrypt Password Hashing
- QR Code Generator

---

## Architecture

User → React Frontend → Express API → MongoDB Database

Short URL Request:
User → Create URL → Store in Database → Generate Short Link

Analytics Flow:
Visitor → Short URL → Redirect → Record Analytics → Update Dashboard

---

## Setup Instructions

### Clone Repository

```bash
git clone <repository-url>
```

### Install Dependencies

Frontend

```bash
npm install
```

Backend

```bash
npm install
```

### Run Application

Frontend

```bash
npm start
```

Backend

```bash
npm run dev
```

---

## Assumptions

- Users must be authenticated to manage URLs.
- Analytics data is stored in the database.
- Short codes are generated uniquely.
- Invalid URLs are rejected.

---

## Demo Video

🎥 Loom Video:

https://www.loom.com/share/f3fac33e856b42559c0f1a6311a87109

---

## 📊 Sample Output Logs & Database Entries

### 1. Sample Database Schema Layout

#### User Document
```json
{
  "_id": "60c72b2f9b1d8b2bad0a1234",
  "email": "user@example.com",
  "password": "$2a$10$hashedpasswordhere...",
  "createdAt": "2026-06-14T09:00:00.000Z"
}
```

#### URL Document
```json
{
  "_id": "60c72b2f9b1d8b2bad0a5678",
  "originalUrl": "https://www.wikipedia.org",
  "shortCode": "wiki-test",
  "creator": "60c72b2f9b1d8b2bad0a1234",
  "expiresAt": "2026-12-31T23:59:59.000Z",
  "createdAt": "2026-06-14T09:05:00.000Z"
}
```

#### Analytics Document (Log)
```json
{
  "_id": "60c72b2f9b1d8b2bad0a9012",
  "urlId": "60c72b2f9b1d8b2bad0a5678",
  "timestamp": "2026-06-14T09:08:18.000Z",
  "ip": "127.0.0.1",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ... Chrome/120.0.0.0",
  "browser": "Chrome",
  "device": "Desktop"
}
```

### 2. Sample Server Logs
```text
Attempting database connection to mongodb://127.0.0.1:27017/url_shortener...
MongoDB connected successfully to local instance.
Backend server listening on port 5000

POST /api/auth/signup - 201 Created
POST /api/urls - 201 Created (Code: wiki-test)
GET /r/wiki-test - 302 Found (IP: 127.0.0.1, Browser: Chrome, Device: Desktop)
GET /api/urls/60c72b2f9b1d8b2bad0a5678/stats - 200 OK

---

## Future Enhancements

- Device Analytics
- Browser Analytics
- Geolocation Tracking
- Public Statistics Page
- Link Expiration
- Bulk URL Shortening
- Advanced Analytics Charts

---

This project is a part of a hackathon run by https://katomaran.com
