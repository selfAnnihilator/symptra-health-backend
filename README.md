
# Symptra Health Backend API

## Overview

This is the backend API for the Symptra Health Admin Panel, built with Node.js, Express, and MongoDB.

## Features

- User Authentication (Register/Login)
- Product Management
- Article/Blog Management with Approval Workflow
- Admin Dashboard with Request Handling
- Role-Based Access Control

## Setup Instructions

1. Clone the repository
2. Navigate to the backend folder
3. Install dependencies:
   ```
   npm install
   ```
4. Copy `.env.example` to `.env` and update the variables
5. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login a user

### Users
- GET /api/users - Get all users (admin only)
- GET /api/users/profile - Get user profile
- DELETE /api/users/:id - Delete a user (admin only)

### Products
- GET /api/products - Get all products
- GET /api/products/:id - Get a single product
- POST /api/products - Create a product (admin only)
- PUT /api/products/:id - Update a product (admin only)
- DELETE /api/products/:id - Delete a product (admin only)

### Articles
- GET /api/articles - Get all published articles
- GET /api/articles/:id - Get a single article
- GET /api/articles/admin/all - Get all articles (admin only)
- POST /api/articles - Create an article (authenticated)
- PUT /api/articles/:id - Update an article (author or admin)
- DELETE /api/articles/:id - Delete an article (admin only)
- POST /api/articles/:id/submit - Submit an article for approval
- PUT /api/articles/:id/review - Approve/reject an article (admin only)

### Requests
- GET /api/requests - Get all requests (admin only)
- GET /api/requests/pending - Get pending requests (admin only)
- PUT /api/requests/:id/process - Process a request (admin only)
- POST /api/requests/bulk-process - Bulk process requests (admin only)

## Authentication

All protected routes require an Authorization header with a Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

## Admin Role

Some routes require admin privileges. By default, all new users have the 'user' role.
To create an admin user, you need to manually update the role in the database.
