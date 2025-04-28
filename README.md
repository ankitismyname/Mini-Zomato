# 🍴 Zomato Restaurant Search Platform

A complete system to load restaurant data, search based on location and cuisines (even through food images), built with Supabase, Next.js, React.js, and Tailwind CSS.

---

## 🚀 Features

- **Load Zomato restaurant data** into Supabase database.
- **REST API endpoints** built using Next.js API routes:
  - Get restaurant by ID.
  - Get list of restaurants with ID-based pagination.
  - Search restaurants within a latitude and longitude range.
  - Image-based search to find restaurants by cuisine.
- **Frontend** built using React.js and Tailwind CSS.
- **Pagination**
  - SQL query with **ID-based pagination** for high performance.
  - JavaScript `range()` function to render pages in frontend.
- **Geo Search**
  - **SQL function** used to filter restaurants within a given radius.
- **Image Search**
  - Upload a food image (e.g., pasta, ice cream).
  - TensorFlow.js model predicts cuisine.
  - Match predicted cuisine against restaurant cuisines in database (split by commas).

---

## 🛠️ Technologies Used

- **Database**: Supabase (PostgreSQL)
- **Backend APIs**: Next.js API Routes
- **Frontend**: React.js, Tailwind CSS
- **Machine Learning**: TensorFlow.js (food recognition model)
- **SQL**:
  - ID-based Pagination
  - Geo-radius Search using SQL

---
