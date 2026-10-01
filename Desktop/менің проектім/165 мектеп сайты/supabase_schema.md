# Supabase Database Schema for №165 School Website

## Tables

### 1. profiles
- id: uuid (references auth.users, primary key)
- first_name: text
- last_name: text
- phone: text (unique)
- role: text (check: 'student', 'parent', 'admin')
- created_at: timestamp with time zone

### 2. news
- id: uuid (primary key)
- title: text
- description: text
- content: text
- image_url: text
- created_at: timestamp with time zone
- updated_at: timestamp with time zone

### 3. lessons
- id: uuid (primary key)
- title: text
- description: text
- video_url: text
- order_index: int
- is_published: boolean
- created_at: timestamp with time zone

### 4. tests
- id: uuid (primary key)
- lesson_id: uuid (references lessons)
- question: text
- options: jsonb (array of options)
- correct_answer: text
- points: int

### 5. progress
- id: uuid (primary key)
- user_id: uuid (references profiles)
- lesson_id: uuid (references lessons)
- video_completed: boolean
- test_completed: boolean
- test_score: int
- completed_at: timestamp with time zone

### 6. social_links
- id: uuid (primary key)
- platform: text
- url: text
