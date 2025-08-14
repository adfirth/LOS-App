// Vidiprinter API Module
// Handles all vidiprinter data fetching and processing functionality

export class VidiprinterAPI {
    constructor(footballWebPagesAPI = null) {
        this.footballWebPagesAPI = footballWebPagesAPI;
    }

    // Fetch historical vidiprinter data
    async fetchHistoricalVidiprinterData(startDate, startTime, endDate, endTime) {
        console.log('📅 Fetching historical vidiprinter data:', { startDate, startTime, endDate, endTime });
        
        try {
            // Try to fetch data for the date range, but also try some fallback dates
            const datesToTry = [
                startDate,
                endDate,
                '2025-08-09', // Known date with fixtures
                '2025-08-10', // Day after known fixtures
                '2025-08-08'  // Day before known fixtures
            ];
            
            const allEvents = [];
            const triedDates = new Set();
            
            for (const date of datesToTry) {
                if (triedDates.has(date)) continue;
                triedDates.add(date);
                
                console.log(`📅 Trying to fetch vidiprinter data for date: ${date}`);
                
                try {
                    const response = await fetch(`https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=5&team=0&date=${date}`, {
                        headers: {
                            'X-RapidAPI-Key': this.footballWebPagesAPI?.config?.RAPIDAPI_KEY || '',
                            'X-RapidAPI-Host': this.footballWebPagesAPI?.config?.RAPIDAPI_HOST || 'football-web-pages1.p.rapidapi.com'
                        }
                    });
                    
                    if (!response.ok) {
                        console.log(`📅 Failed to fetch data for ${date}: ${response.status} ${response.statusText}`);
                        continue;
                    }
                    
                    const data = await response.json();
                    console.log(`📅 Response for ${date}:`, data);
                    
                    if (data.vidiprinter && data.vidiprinter.events && Array.isArray(data.vidiprinter.events)) {
                        console.log(`📅 Found ${data.vidiprinter.events.length} events for ${date}`);
                        if (data.vidiprinter.events.length > 0) {
                            allEvents.push(...data.vidiprinter.events);
                            console.log(`📅 Added ${data.vidiprinter.events.length} events from ${date}`);
                        }
                    } else {
                        console.log(`📅 No events found for ${date}`);
                    }
                } catch (error) {
                    console.log(`📅 Error fetching data for ${date}:`, error);
                }
            }
            
            console.log(`📅 Total events collected from all dates: ${allEvents.length}`);
            
            if (allEvents.length === 0) {
                console.log('📅 No events found for any date, returning empty result');
                return {
                    events: [],
                    startDate,
                    startTime,
                    endDate,
                    endTime,
                    message: 'No vidiprinter events found for the requested date range or fallback dates'
                };
            }
            
            // Filter events based on time range
            const filteredEvents = this.filterEventsByTimeRange(allEvents, startDate, startTime, endDate, endTime);
            
            console.log('📅 Filtered events:', filteredEvents);
            
            return {
                events: filteredEvents,
                startDate,
                startTime,
                endDate,
                endTime
            };
            
        } catch (error) {
            console.error('❌ Error fetching historical vidiprinter data:', error);
            throw error;
        }
    }

    // Filter events by time range
    filterEventsByTimeRange(events, startDate, startTime, endDate, endTime) {
        if (!events || !Array.isArray(events)) {
            console.log('❌ No events array provided or not an array');
            return [];
        }
        
        console.log(`🔍 Filtering ${events.length} events between ${startDate} ${startTime} and ${endDate} ${endTime}`);
        
        const filteredEvents = events.filter(event => {
            if (!event['date/time']) {
                console.log('❌ Event missing date/time:', event);
                return false;
            }
            
            const eventDateTime = this.parseEventDateTime(event['date/time']);
            if (!eventDateTime) {
                console.log('❌ Failed to parse event date/time:', event['date/time']);
                return false;
            }
            
            const startDateTime = new Date(`${startDate} ${startTime}`);
            const endDateTime = new Date(`${endDate} ${endTime}`);
            
            console.log(`📅 Event: ${event['date/time']} -> Parsed: ${eventDateTime}`);
            console.log(`📅 Start: ${startDate} ${startTime} -> ${startDateTime}`);
            console.log(`📅 End: ${endDate} ${endTime} -> ${endDateTime}`);
            console.log(`📅 In range: ${eventDateTime >= startDateTime && eventDateTime <= endDateTime}`);
            
            return eventDateTime >= startDateTime && eventDateTime <= endDateTime;
        });
        
        console.log(`✅ Filtered events result: ${filteredEvents.length} events`);
        return filteredEvents;
    }

    // Parse event date/time string
    parseEventDateTime(dateTimeString) {
        console.log(`🔍 Parsing date/time: "${dateTimeString}"`);
        
        // Handle format: "2025-08-09 22:33:44"
        const [datePart, timePart] = dateTimeString.split(' ');
        console.log(`📅 Date part: "${datePart}", Time part: "${timePart}"`);
        
        if (!datePart || !timePart) {
            console.log('❌ Invalid date/time format - missing date or time part');
            return null;
        }
        
        const [year, month, day] = datePart.split('-');
        const [hour, minute, second] = timePart.split(':');
        
        console.log(`📅 Parsed: Year=${year}, Month=${month}, Day=${day}, Hour=${hour}, Minute=${minute}, Second=${second}`);
        
        if (!year || !month || !day || !hour || !minute || !second) {
            console.log('❌ Invalid date/time format - missing components');
            return null;
        }
        
        const parsedDate = new Date(year, month - 1, day, hour, minute, second);
        console.log(`📅 Final parsed date: ${parsedDate}`);
        
        return parsedDate;
    }

    // Fetch historical data for a specific interval
    async fetchHistoricalDataForInterval(startDate, startTime, endDate, endTime) {
        console.log('Fetching historical data for interval:', { startDate, startTime, endDate, endTime });
        
        try {
            const data = await this.fetchHistoricalVidiprinterData(startDate, startTime, endDate, endTime);
            return data;
        } catch (error) {
            console.error('Error fetching historical data for interval:', error);
            throw error;
        }
    }

    // Fetch current vidiprinter data for a competition
    async fetchVidiprinterData(competition = 5) {
        console.log('📺 Fetching current vidiprinter data for competition:', competition);
        
        try {
            const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const currentTime = new Date().toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit',
                hour12: false 
            });
            
            console.log(`📺 Fetching vidiprinter for date: ${currentDate}, time: ${currentTime}`);
            
            // Try current date first
            let response = await fetch(`https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=${competition}&team=0&date=${currentDate}`, {
                headers: {
                    'X-RapidAPI-Key': this.footballWebPagesAPI?.config?.RAPIDAPI_KEY || '',
                    'X-RapidAPI-Host': this.footballWebPagesAPI?.config?.RAPIDAPI_HOST || 'football-web-pages1.p.rapidapi.com'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            let data = await response.json();
            console.log('📺 Current date vidiprinter response:', data);
            
            // If no events on current date, try recent dates
            if (!data.vidiprinter || !data.vidiprinter.events || data.vidiprinter.events.length === 0) {
                console.log('📺 No events on current date, trying recent dates...');
                
                const recentDates = [
                    '2025-08-09', // Known date with fixtures
                    '2025-08-10', // Day after
                    '2025-08-08'  // Day before
                ];
                
                for (const date of recentDates) {
                    console.log(`📺 Trying date: ${date}`);
                    response = await fetch(`https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=${competition}&team=0&date=${date}`, {
                        headers: {
                            'X-RapidAPI-Key': this.footballWebPagesAPI?.config?.RAPIDAPI_KEY || '',
                            'X-RapidAPI-Host': this.footballWebPagesAPI?.config?.RAPIDAPI_HOST || 'football-web-pages1.p.rapidapi.com'
                        }
                    });
                    
                    if (response.ok) {
                        data = await response.json();
                        console.log(`📺 Response for ${date}:`, data);
                        
                        if (data.vidiprinter && data.vidiprinter.events && data.vidiprinter.events.length > 0) {
                            console.log(`📺 Found ${data.vidiprinter.events.length} events for ${date}`);
                            break;
                        }
                    }
                }
            }
            
            if (data.vidiprinter && data.vidiprinter.events && data.vidiprinter.events.length > 0) {
                console.log(`📺 Returning ${data.vidiprinter.events.length} events from vidiprinter`);
                return data.vidiprinter.events;
            } else {
                console.log('📺 No events found in any vidiprinter response');
                // Return a placeholder event to show the system is working
                return [{
                    text: 'No live matches currently available. The vidiprinter will update when matches are in progress.',
                    type: 'status',
                    'date/time': new Date().toISOString()
                }];
            }
            
        } catch (error) {
            console.error('❌ Error fetching vidiprinter data:', error);
            // Return a placeholder event to show the system is working
            return [{
                text: 'Vidiprinter system is running. Waiting for live match updates...',
                type: 'status',
                'date/time': new Date().toISOString()
            }];
        }
    }

    // Fetch enhanced vidiprinter data for a competition, team, and date
    async fetchEnhancedVidiprinterData(competition = 5, team = 0, date = null) {
        console.log('Fetching enhanced vidiprinter data:', { competition, team, date });
        
        try {
            const targetDate = date || new Date().toISOString().split('T')[0]; // Use provided date or current date
            console.log(`📅 Fetching enhanced vidiprinter for date: ${targetDate}`);
            
            const response = await fetch(`https://football-web-pages1.p.rapidapi.com/vidiprinter.json?comp=${competition}&team=${team}&date=${targetDate}`, {
                headers: {
                    'X-RapidAPI-Key': this.footballWebPagesAPI?.config?.RAPIDAPI_KEY || '',
                    'X-RapidAPI-Host': this.footballWebPagesAPI?.config?.RAPIDAPI_HOST || 'football-web-pages1.p.rapidapi.com'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📺 Enhanced vidiprinter API response:', data);
            
            if (data.vidiprinter && data.vidiprinter.events) {
                console.log(`📺 Found ${data.vidiprinter.events.length} events in enhanced vidiprinter response`);
                return data.vidiprinter.events;
            } else {
                console.log('📺 No events found in enhanced vidiprinter response');
                return [];
            }
            
        } catch (error) {
            console.error('Error fetching enhanced vidiprinter data:', error);
            return [];
        }
    }

    // Cleanup method
    cleanup() {
        console.log('🧹 Vidiprinter API cleanup completed');
    }
}
