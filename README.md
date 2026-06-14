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

## Sample Outputs

Add screenshots, logs, analytics dashboard images, and database records here.

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
