# NYC Semester Maximizer

## Problem Statement
As a study abroad student in NYC with limited time remaining, I face the constant tension between needing to complete intensive academic work and wanting to maximize my cultural experience in this incredible city. I fall into predictable routines studying in the same cafes, missing unique opportunities while also struggling to maintain academic focus. Traditional planners don't understand the specific challenges of being a temporary resident trying to balance coursework with once-in-a-lifetime experiences.

## Solution
NYC Semester Maximizer is a React web application that creates optimized daily schedules combining productive study sessions with carefully curated NYC discoveries. It uses real-time data from multiple APIs to suggest authentic study spaces and cultural experiences, ensuring students make the most of their limited time in New York City without sacrificing academic performance.

## API Used

- **Open-Meteo Weather API** - Provides real-time NYC weather data to suggest indoor/outdoor activities
- **NYC Open Data API** - Fetches actual public library locations and information in Manhattan  
- **Bored API** - Generates random activity suggestions adapted for NYC context

**How they're used**: 
- Weather data determines optimal study locations and activity types (indoor vs outdoor)
- Library API provides real study spaces with actual NYC public library locations
- Activity API suggests unique, randomized experiences to break routine and discover new things

**API Documentation**:
- Open-Meteo: https://open-meteo.com/
- NYC Open Data: https://opendata.cityofnewyork.us/
- Bored API: https://www.boredapi.com/

## Features

- **Real-time countdown timer** showing days left in NYC
- **Live weather integration** from Open-Meteo API
- **Actual NYC library locations** from NYC Open Data API
- **Random activity suggestions** from Bored API
- **Intelligent daily schedule generator** balancing study and exploration
- **Interactive task completion** with progress tracking
- **Stats dashboard** (study hours, places visited, productivity score)
- **API data visualization** showing live data sources
- **Mobile-responsive design** with NYC-themed styling

## Setup Instructions

1. Clone this repository:
   ```bash
   git clone https://github.com/Oumycodes/Everyone-is-a-designer.git
   ```

2. Navigate to project:
   ```bash
   cd Everyone-is-a-designer
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

*Note: All APIs used are free and require no authentication keys*

## AI Assistance

I used **ChatGPT** to help with:

- **API Integration Patterns**: Learned how to structure multiple API calls with React hooks and handle loading states across different data sources
- **Error Handling Implementation**: Received guidance on creating robust error boundaries and fallback mechanisms for when APIs are unavailable
- **Data Transformation**: Learned best practices for processing and formatting API responses to fit the application's needs
- **Async Operations**: Got suggestions for handling multiple simultaneous API requests using Promise.all()

**What I learned**: How to implement proper loading states, handle API failures gracefully, transform complex JSON data into usable formats, and manage multiple asynchronous operations efficiently.

**Modifications made**: I adapted generic API examples to fit the specific NYC student context, created custom data mapping functions for each API, and implemented a caching strategy to optimize performance while maintaining data freshness.

## Screenshots

*Main dashboard showing live weather data and API-powered schedule*

*API data tab showing real-time information from all integrated APIs*

## Future Improvements

- Add user authentication to save preferences and progress
- Implement Google Places API for real-time cafe and study spot recommendations
- Add NYC transit API for travel time calculations between locations
- Create social features for study abroad student communities
- Develop predictive scheduling using machine learning based on user preferences
- Add photo journal integration to document experiences
- Implement budget tracking for NYC activities and expenses

---

**Developed with React • Vite • Real APIs**  
**Submission for Project 7: Everyone's A Designer**
