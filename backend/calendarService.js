const { google } = require('googleapis');

// Load service account credentials (replace with your actual key file path)
const SERVICE_ACCOUNT_KEY_FILE = './path/to/service-account-key.json'; // Update this path
const CALENDAR_ID = 'primary'; // Or your specific calendar ID

// Authenticate with Google
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

// Create an event in Google Calendar
async function createEvent(eventDate, title, description) {
  try {
    const event = {
      summary: title,
      description: description,
      start: {
        date: eventDate, // Assuming date is in YYYY-MM-DD format
        timeZone: 'Asia/Manila', // Adjust timezone as needed
      },
      end: {
        date: eventDate,
        timeZone: 'Asia/Manila',
      },
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

// Get events for a date range
async function getEvents(startDate, endDate) {
  try {
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

// Count events on a specific date
async function countEventsOnDate(date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
    });

    return response.data.items.length;
  } catch (error) {
    console.error('Error counting events:', error);
    throw error;
  }
}

module.exports = {
  createEvent,
  getEvents,
  countEventsOnDate,
};
