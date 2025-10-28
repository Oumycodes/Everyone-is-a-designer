import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, BookOpen, Coffee, Camera, Sparkles, TrendingUp, CheckCircle, Settings, X } from 'lucide-react';

// --- HELPER FUNCTIONS FOR SCHEDULE OPTIMIZATION ---

/**
 * Converts a time string (e.g., '9:00 AM' or '9:00 AM - 12:00 PM') to minutes past midnight.
 * This allows for easy chronological sorting and comparison.
 */
const timeToMinutes = (timeStr) => {
  // Use the start time for the calculation
  const startStr = timeStr.split(' - ')[0].trim();
  let [time, period] = startStr.split(' ');

  // Handle cases where period might be missing (though data uses it)
  if (!period) period = 'AM'; 

  let [hours, minutes] = time.split(':').map(Number);

  if (period === 'PM' && hours < 12) {
    hours += 12;
  }
  if (period === 'AM' && hours === 12) {
    hours = 0; // Midnight case (if 12:XX AM)
  }
  return hours * 60 + minutes;
};

/**
 * Calculates the duration of an activity in minutes.
 */
const calculateDuration = (timeStr) => {
  const parts = timeStr.split(' - ').map(s => s.trim());
  const [startStr, endStr] = parts;

  if (!endStr) {
    // Arbitrary default duration for single-time activities (e.g., a quick bite).
    // Let's assume a 1-hour buffer for these.
    return 60;
  }

  const startMinutes = timeToMinutes(startStr);
  const endMinutes = timeToMinutes(endStr);

  let duration = endMinutes - startMinutes;
  // If end time is before start time (e.g., crosses midnight, though unlikely here)
  if (duration < 0) {
    duration += 24 * 60; 
  }
  return duration;
};

/**
 * Checks if a new item's time range overlaps with any existing item's time range.
 */
const doesOverlap = (existingSchedule, newItem) => {
  const newItemStart = timeToMinutes(newItem.time);
  const newItemDuration = calculateDuration(newItem.time);
  const newItemEnd = newItemStart + newItemDuration;

  for (const existingItem of existingSchedule) {
    const existingStart = timeToMinutes(existingItem.time);
    const existingDuration = calculateDuration(existingItem.time);
    const existingEnd = existingStart + existingDuration;

    // Check for overlap: [StartA < EndB] AND [EndA > StartB]
    if (newItemStart < existingEnd && newItemEnd > existingStart) {
      return true;
    }
  }
  return false;
};

// --- REACT COMPONENT START ---

const NYCMaximizer = () => {
  const [daysLeft, setDaysLeft] = useState(0);
  const [currentSchedule, setCurrentSchedule] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [stats, setStats] = useState({ studyHours: 0, placesVisited: 0, productivity: 0 });
  const [activeTab, setActiveTab] = useState('today');
  const [showSettings, setShowSettings] = useState(false);
  const [departureDate, setDepartureDate] = useState('2024-12-15');
  const [tempDate, setTempDate] = useState('2024-12-15');

  const nycActivities = {
    study: [
      { icon: '📚', place: 'NYPL Rose Reading Room', time: '9:00 AM - 12:00 PM', type: 'Deep Work', location: '5th Ave & 42nd St' },
      { icon: '☕', place: 'Think Coffee Study Session', time: '2:00 PM - 5:00 PM', type: 'Focus Time', location: 'Multiple Locations' },
      { icon: '🏛️', place: 'Columbia Butler Library', time: '10:00 AM - 1:00 PM', type: 'Quiet Study', location: 'Morningside Heights' },
      { icon: '🎓', place: 'Brooklyn Public Library', time: '1:00 PM - 4:00 PM', type: 'Group Study', location: 'Grand Army Plaza' },
    ],
    culture: [
      { icon: '🎨', place: 'MoMA Free Friday', time: '5:30 PM - 9:00 PM', type: 'Art', location: 'Midtown' },
      { icon: '🗽', place: 'Brooklyn Bridge Walk', time: '6:00 PM - 7:30 PM', type: 'Iconic', location: 'Brooklyn Bridge' },
      { icon: '🎭', place: 'Broadway Rush Tickets', time: '7:00 PM', type: 'Theatre', location: 'Times Square' },
      { icon: '🌆', place: 'High Line Sunset Stroll', time: '5:00 PM - 6:30 PM', type: 'Views', location: 'Chelsea' },
      { icon: '📸', place: 'DUMBO Photo Spots', time: '4:00 PM - 5:30 PM', type: 'Photography', location: 'Brooklyn' },
    ],
    food: [
      { icon: '🍕', place: "Joe's Pizza Slice", time: '12:30 PM', type: 'Quick Bite', location: 'Greenwich Village' },
      { icon: '🥯', place: 'Ess-a-Bagel', time: '8:00 AM', type: 'Breakfast', location: 'Midtown East' },
      { icon: '🍜', place: "Xi'an Famous Foods", time: '1:00 PM', type: 'Lunch', location: 'Multiple Locations' },
      { icon: '🌮', place: 'Los Tacos No. 1', time: '6:00 PM', type: 'Dinner', location: 'Chelsea Market' },
    ],
    hidden: [
      { icon: '🌿', place: 'Elevated Acre Secret Garden', time: '3:00 PM', type: 'Hidden Gem', location: 'Financial District' },
      { icon: '🎵', place: 'Washington Square Musicians', time: '4:00 PM', type: 'Local Scene', location: 'Greenwich Village' },
      { icon: '🏛️', place: 'The Cloisters', time: '11:00 AM - 2:00 PM', type: 'Museums', location: 'Fort Tryon Park' },
      { icon: '📚', place: 'Strand Bookstore Browse', time: '2:00 PM', type: 'Culture', location: 'Union Square' },
    ]
  };

  useEffect(() => {
    const calculateDays = () => {
      const departure = new Date(departureDate);
      const today = new Date();
      // Reset time for accurate day count
      departure.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0); 
      
      const diffTime = departure.getTime() - today.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      const days = Math.ceil(diffDays);

      setDaysLeft(days > 0 ? days : 0);
    };
    calculateDays();
    const interval = setInterval(calculateDays, 60000);
    return () => clearInterval(interval);
  }, [departureDate]);

  // --- UPDATED generateSchedule FUNCTION ---
  const generateSchedule = () => {
    // Define the desired structure of the day
    const desiredScheduleConfig = [
      { category: 'study', count: 2 },
      { category: 'food', count: 1 },
      { category: 'culture', count: 1 },
      { category: 'hidden', count: 1 }
    ];

    let newSchedule = [];

    // Iterate through required activity types and attempt to add them
    for (const { category, count } of desiredScheduleConfig) {
      // Create a shuffled copy of the activities for random selection
      const shuffledActivities = [...nycActivities[category]].sort(() => 0.5 - Math.random());
      let addedCount = 0;

      for (const activity of shuffledActivities) {
        if (addedCount >= count) break;
        
        // Check for time conflict with already added items
        if (!doesOverlap(newSchedule, activity)) {
          newSchedule.push(activity);
          addedCount++;
        }
      }
    }

    // Sort the final schedule chronologically using the helper function
    newSchedule.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    setCurrentSchedule(newSchedule);
    setCompletedTasks([]); // Reset completed tasks for the new day
  };

  useEffect(() => {
    generateSchedule();
  }, []);

  const toggleComplete = (index) => {
    const isStudy = currentSchedule[index].type === 'Deep Work' || currentSchedule[index].type === 'Focus Time' || currentSchedule[index].type === 'Quiet Study' || currentSchedule[index].type === 'Group Study';
    
    if (completedTasks.includes(index)) {
      setCompletedTasks(completedTasks.filter(i => i !== index));
      // Deduct stats
      setStats(prev => ({ 
        ...prev, 
        studyHours: isStudy ? Math.max(0, prev.studyHours - 3) : prev.studyHours,
        placesVisited: Math.max(0, prev.placesVisited - 1),
        productivity: Math.max(0, prev.productivity - 15)
      }));
    } else {
      setCompletedTasks([...completedTasks, index]);
      // Add stats. Note: Adjusting study hours based on item type for better realism.
      setStats(prev => ({ 
        ...prev, 
        studyHours: isStudy ? prev.studyHours + 3 : prev.studyHours, // Add 3 hours for study tasks
        placesVisited: prev.placesVisited + 1,
        productivity: Math.min(100, prev.productivity + 15)
      }));
    }
  };

  const handleSaveDate = () => {
    setDepartureDate(tempDate);
    setShowSettings(false);
  };

  const handleCancelSettings = () => {
    setTempDate(departureDate);
    setShowSettings(false);
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">🗽 NYC Semester Maximizer</h1>
        <p className="subtitle">Balance academics with adventure</p>
        <button className="settings-btn" onClick={() => setShowSettings(true)}>
          <Settings size={20} />
          <span>Set Departure Date</span>
        </button>
      </div>

      <div className="countdown-card">
        <div className="countdown-content">
          <Clock size={40} color="white" />
          <div className="countdown-text">
            <div className="days-number">{daysLeft}</div>
            <div className="days-label">Days Left in NYC</div>
          </div>
        </div>
        <div className="motivation-text">
          Make every moment unforgettable ✨
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <BookOpen size={24} color="#3498db" />
          <div className="stat-number">{stats.studyHours}h</div>
          <div className="stat-label">Study Time</div>
        </div>
        <div className="stat-card">
          <MapPin size={24} color="#e74c3c" />
          <div className="stat-number">{stats.placesVisited}</div>
          <div className="stat-label">Places Visited</div>
        </div>
        <div className="stat-card">
          <TrendingUp size={24} color="#2ecc71" />
          <div className="stat-number">{stats.productivity}%</div>
          <div className="stat-label">Productivity</div>
        </div>
      </div>

      <div className="tab-container">
        <button 
          className={activeTab === 'today' ? 'tab active-tab' : 'tab'}
          onClick={() => setActiveTab('today')}
        >
          Today's Plan
        </button>
        <button 
          className={activeTab === 'discover' ? 'tab active-tab' : 'tab'}
          onClick={() => setActiveTab('discover')}
        >
          Discover NYC
        </button>
      </div>

      {activeTab === 'today' && (
        <div className="schedule-container">
          <div className="schedule-header">
            <h3 className="schedule-title">Today's Balanced Schedule</h3>
            <button className="generate-btn" onClick={generateSchedule}>
              <Sparkles size={18} />
              <span>Generate New Day</span>
            </button>
          </div>

          <div className="timeline">
            {currentSchedule.length > 0 ? (
              currentSchedule.map((item, index) => (
                <div 
                  key={index} 
                  className={completedTasks.includes(index) ? 'schedule-item completed-item' : 'schedule-item'}
                >
                  <div className="schedule-icon">{item.icon}</div>
                  <div className="schedule-details">
                    <div className="schedule-time">{item.time}</div>
                    <div className="schedule-name">{item.place}</div>
                    <div className="schedule-location">
                      <MapPin size={14} />
                      {item.location}
                    </div>
                  </div>
                  <button 
                    className="check-btn"
                    onClick={() => toggleComplete(index)}
                  >
                    <CheckCircle 
                      size={24} 
                      color={completedTasks.includes(index) ? '#2ecc71' : '#ddd'}
                      fill={completedTasks.includes(index) ? '#2ecc71' : 'none'}
                    />
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>
                <p>Couldn't generate a full, non-overlapping schedule. Try the "Generate New Day" button!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'discover' && (
        <div className="discover-container">
          <div className="category-section">
            <h4 className="category-title">🎨 Cultural Experiences</h4>
            <div className="activity-grid">
              {nycActivities.culture.map((item, idx) => (
                <div key={idx} className="activity-card">
                  <div className="activity-icon">{item.icon}</div>
                  <div className="activity-name">{item.place}</div>
                  <div className="activity-type">{item.type}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="category-section">
            <h4 className="category-title">💎 Hidden Gems</h4>
            <div className="activity-grid">
              {nycActivities.hidden.map((item, idx) => (
                <div key={idx} className="activity-card">
                  <div className="activity-icon">{item.icon}</div>
                  <div className="activity-name">{item.place}</div>
                  <div className="activity-type">{item.type}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="tips-card">
        <Coffee size={24} color="#f39c12" />
        <div className="tip-text">
          <strong>Pro Tip:</strong> Museums often have free hours on Friday evenings. 
          Plan your study sessions around them! 
        </div>
      </div>

      {showSettings && (
        <div className="modal-overlay" onClick={handleCancelSettings}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙️ Settings</h3>
              <button className="close-btn" onClick={handleCancelSettings}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <label className="input-label">
                <Calendar size={20} />
                <span>When are you leaving NYC?</span>
              </label>
              <input 
                type="date" 
                className="date-input"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
              />
              <p className="input-hint">
                We'll calculate how many days you have left to explore!
              </p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={handleCancelSettings}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSaveDate}>
                Save Date
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          position: relative;
        }
        .settings-btn {
          position: absolute;
          top: 0;
          right: 0;
          background: white;
          border: 2px solid #667eea;
          color: #667eea;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 0.9em;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
        }
        .settings-btn:hover {
          background: #667eea;
          color: white;
          transform: translateY(-2px);
        }
        .title {
          font-size: 3em;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }
        .subtitle {
          font-size: 1.2em;
          color: #5a6c7d;
          margin: 10px 0 0 0;
        }
        .countdown-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        .countdown-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 15px;
        }
        .countdown-text {
          color: white;
          text-align: left;
        }
        .days-number {
          font-size: 3.5em;
          font-weight: 800;
          line-height: 1;
        }
        .days-label {
          font-size: 1.2em;
          opacity: 0.9;
        }
        .motivation-text {
          text-align: center;
          color: white;
          font-size: 1.1em;
          opacity: 0.95;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .stat-card {
          background: white;
          border-radius: 15px;
          padding: 25px;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          transition: transform 0.2s;
          cursor: pointer;
        }
        .stat-card:hover {
          transform: translateY(-5px);
        }
        .stat-number {
          font-size: 2.5em;
          font-weight: 700;
          color: #2c3e50;
          margin: 10px 0 5px 0;
        }
        .stat-label {
          color: #7f8c8d;
          font-size: 0.95em;
        }
        .tab-container {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          background: white;
          padding: 8px;
          border-radius: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        .tab {
          flex: 1;
          padding: 15px;
          border: none;
          background: transparent;
          border-radius: 10px;
          font-size: 1em;
          font-weight: 600;
          color: #7f8c8d;
          cursor: pointer;
          transition: all 0.3s;
        }
        .active-tab {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .schedule-container {
          background: white;
          border-radius: 20px;
          padding: 30px;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        .schedule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
          gap: 15px;
        }
        .schedule-title {
          font-size: 1.8em;
          font-weight: 700;
          color: #2c3e50;
          margin: 0;
        }
        .generate-btn {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          border: none;
          padding: 12px 25px;
          border-radius: 10px;
          font-size: 1em;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s;
        }
        .generate-btn:hover {
          transform: scale(1.05);
        }
        .timeline {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .schedule-item {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          border-left: 5px solid #3498db;
          transition: all 0.3s;
        }
        .schedule-item:hover {
          transform: translateX(5px);
        }
        .completed-item {
          opacity: 0.6;
          border-left: 5px solid #2ecc71;
        }
        .schedule-icon {
          font-size: 2.5em;
          min-width: 60px;
          text-align: center;
        }
        .schedule-details {
          flex: 1;
        }
        .schedule-time {
          color: #3498db;
          font-weight: 600;
          font-size: 0.95em;
          margin-bottom: 5px;
        }
        .schedule-name {
          font-size: 1.2em;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 5px;
        }
        .schedule-location {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #7f8c8d;
          font-size: 0.9em;
        }
        .check-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 5px;
          transition: transform 0.2s;
        }
        .check-btn:hover {
          transform: scale(1.1);
        }
        .discover-container {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .category-section {
          background: white;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        .category-title {
          font-size: 1.5em;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 20px;
        }
        .activity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
        }
        .activity-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
        }
        .activity-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        }
        .activity-icon {
          font-size: 2.5em;
          margin-bottom: 10px;
        }
        .activity-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 5px;
          font-size: 0.95em;
        }
        .activity-type {
          color: #7f8c8d;
          font-size: 0.85em;
        }
        .tips-card {
          background: white;
          border-radius: 15px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        .tip-text {
          color: #2c3e50;
          line-height: 1.6;
        }
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          transform: scale(1);
          transition: transform 0.3s ease-out;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .modal-header h3 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.5em;
        }
        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #7f8c8d;
          padding: 5px;
        }
        .modal-body {
          margin-bottom: 30px;
        }
        .input-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: #3498db;
          margin-bottom: 10px;
        }
        .date-input {
          width: 100%;
          padding: 15px;
          border: 2px solid #ddd;
          border-radius: 10px;
          font-size: 1.1em;
          box-sizing: border-box;
          margin-top: 5px;
        }
        .input-hint {
          color: #7f8c8d;
          font-size: 0.9em;
          margin-top: 10px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
        }
        .cancel-btn, .save-btn {
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .cancel-btn {
          background: #f1f1f1;
          color: #2c3e50;
          border: none;
        }
        .save-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        }
        @media (max-width: 768px) {
          .title {
            font-size: 2em;
          }
          .settings-btn {
            position: static;
            margin: 20px auto 0;
          }
          .header {
            text-align: center;
          }
          .countdown-content {
            flex-direction: column;
          }
          .schedule-header {
            flex-direction: column;
            align-items: stretch;
          }
          .generate-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default NYCMaximizer;