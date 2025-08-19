// History Manager Module
// Handles score saving, importing from external sources, and historical score management

export class HistoryManager {
    constructor(db, currentActiveEdition = 1, apiManager = null) {
        this.db = db;
        this.currentActiveEdition = currentActiveEdition;
        this.apiManager = apiManager;
    }

    // Save scores for a gameweek
    saveScores(onResultsProcessed = null) {
        const gameweek = document.querySelector('#score-gameweek-select').value;
        const scoreRows = document.querySelectorAll('.score-row');
        const updatedFixtures = [];

        console.log(`saveScores called - gameweek: ${gameweek}, currentActiveEdition: ${this.currentActiveEdition}`);

        const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
        const editionGameweekKey = `edition${this.currentActiveEdition}_${gameweekKey}`;
        
        console.log(`Attempting to save scores for ${editionGameweekKey}`);
        this.db.collection('fixtures').doc(editionGameweekKey).get().then(doc => {
            if (doc.exists) {
                const fixtures = doc.data().fixtures;
                console.log(`Found ${fixtures.length} fixtures for ${editionGameweekKey}`);
                
                scoreRows.forEach((row, index) => {
                    if (fixtures[index]) {
                        // Handle current scores (if present)
                        const currentHomeScore = row.querySelector('.home-score-current');
                        const currentAwayScore = row.querySelector('.away-score-current');
                        
                        // Use current score if available, otherwise use full-time score
                        let homeScore, awayScore;
                        if (currentHomeScore && currentAwayScore) {
                            homeScore = currentHomeScore.value;
                            awayScore = currentAwayScore.value;
                        } else {
                            const homeScoreElement = row.querySelector('.home-score');
                            const awayScoreElement = row.querySelector('.away-score');
                            homeScore = homeScoreElement ? homeScoreElement.value : null;
                            awayScore = awayScoreElement ? awayScoreElement.value : null;
                        }
                        
                        const homeScoreHTElement = row.querySelector('.home-score-ht');
                        const awayScoreHTElement = row.querySelector('.away-score-ht');
                        const completedElement = row.querySelector('.fixture-completed');
                        const statusElement = row.querySelector('.match-status-select');
                        
                        const homeScoreHT = homeScoreHTElement ? homeScoreHTElement.value : null;
                        const awayScoreHT = awayScoreHTElement ? awayScoreHTElement.value : null;
                        const completed = completedElement ? completedElement.checked : false;
                        const status = statusElement ? statusElement.value : 'FT';
                        
                        updatedFixtures.push({
                            ...fixtures[index],
                            homeScore: homeScore ? parseInt(homeScore) : null,
                            awayScore: awayScore ? parseInt(awayScore) : null,
                            homeScoreHT: homeScoreHT ? parseInt(homeScoreHT) : null,
                            awayScoreHT: awayScoreHT ? parseInt(awayScoreHT) : null,
                            completed: completed,
                            status: status
                        });
                    }
                });

                this.db.collection('fixtures').doc(editionGameweekKey).update({
                    fixtures: updatedFixtures
                }).then(() => {
                    const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
                    alert(`Scores saved for ${displayText}`);
                    // Process results to update lives
                    // Process results if callback provided
                    if (onResultsProcessed) {
                        onResultsProcessed(gameweek, updatedFixtures);
                    }
                }).catch(error => {
                    console.error('Error saving scores:', error);
                    alert('Error saving scores');
                });
            } else {
                console.log(`No fixtures document found for ${editionGameweekKey} - checking old structure`);
                
                // Fallback to old structure
                this.db.collection('fixtures').doc(gameweekKey).get().then(oldDoc => {
                    if (oldDoc.exists) {
                        const fixtures = oldDoc.data().fixtures;
                        console.log(`Found ${fixtures.length} fixtures in old structure for ${gameweekKey}`);
                        
                        scoreRows.forEach((row, index) => {
                            if (fixtures[index]) {
                                // Handle current scores (if present)
                                const currentHomeScore = row.querySelector('.home-score-current');
                                const currentAwayScore = row.querySelector('.away-score-current');
                                
                                // Use current score if available, otherwise use full-time score
                                let homeScore, awayScore;
                                if (currentHomeScore && currentAwayScore) {
                                    homeScore = currentHomeScore.value;
                                    awayScore = currentAwayScore.value;
                                } else {
                                    const homeScoreElement = row.querySelector('.home-score');
                                    const awayScoreElement = row.querySelector('.away-score');
                                    homeScore = homeScoreElement ? homeScoreElement.value : null;
                                    awayScore = awayScoreElement ? awayScoreElement.value : null;
                                }
                                
                                const homeScoreHTElement = row.querySelector('.home-score-ht');
                                const awayScoreHTElement = row.querySelector('.away-score-ht');
                                const completedElement = row.querySelector('.fixture-completed');
                                const statusElement = row.querySelector('.match-status-select');
                                
                                const homeScoreHT = homeScoreHTElement ? homeScoreHTElement.value : null;
                                const awayScoreHT = awayScoreHTElement ? awayScoreHTElement.value : null;
                                const completed = completedElement ? completedElement.checked : false;
                                const status = statusElement ? statusElement.value : 'FT';
                                
                                fixtures[index] = {
                                    ...fixtures[index],
                                    homeScore: homeScore ? parseInt(homeScore) : null,
                                    awayScore: awayScore ? parseInt(awayScore) : null,
                                    homeScoreHT: homeScoreHT ? parseInt(homeScoreHT) : null,
                                    awayScoreHT: awayScoreHT ? parseInt(awayScoreHT) : null,
                                    completed: completed,
                                    status: status
                                };
                            }
                        });

                        // Save to old structure
                        this.db.collection('fixtures').doc(gameweekKey).update({
                            fixtures: fixtures
                        }).then(() => {
                            const displayText = gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`;
                            alert(`Scores saved for ${displayText}`);
                            // Process results to update lives
                            // Process results if callback provided
                            if (onResultsProcessed) {
                                onResultsProcessed(gameweek, fixtures);
                            }
                        }).catch(error => {
                            console.error('Error saving scores to old structure:', error);
                            alert('Error saving scores');
                        });
                    } else {
                        console.log(`No fixtures document found in old structure either - creating empty document`);
                        
                        // Create empty fixtures array for this gameweek
                        const emptyFixtures = [];
                        
                        // Create the document with empty fixtures
                        this.db.collection('fixtures').doc(editionGameweekKey).set({
                            fixtures: emptyFixtures
                        }).then(() => {
                            console.log(`Created empty fixtures document for ${editionGameweekKey}`);
                            alert(`Created empty fixtures document for ${gameweek === 'tiebreak' ? 'Tiebreak Round' : `Game Week ${gameweek}`}. Please add fixtures first, then save scores.`);
                        }).catch(error => {
                            console.error('Error creating fixtures document:', error);
                            alert('Error creating fixtures document. Please try again.');
                        });
                    }
                }).catch(oldError => {
                    console.error('Error checking old structure:', oldError);
                    alert('Error accessing fixtures. Please try again.');
                });
            }
        }).catch(error => {
            console.error('Error accessing fixtures document:', error);
            alert('Error accessing fixtures. Please try again.');
        });
    }

    // Import scores from file
    async importScoresFromFile(file, gameweek) {
        console.log('importScoresFromFile called with gameweek:', gameweek);
        
        try {
            const text = await file.text();
            const scores = JSON.parse(text);
            
            if (Array.isArray(scores)) {
                console.log(`Importing ${scores.length} scores from file`);
                // Process the imported scores
                // This would need to be implemented based on the file format
            } else {
                console.error('Invalid file format: expected array of scores');
                alert('Invalid file format. Please check the file and try again.');
            }
        } catch (error) {
            console.error('Error importing scores from file:', error);
            alert('Error importing scores: ' + error.message);
        }
    }

    // Import scores from Football WebPages API
    async importScoresFromFootballWebPages(gameweek) {
        console.log(`📥 Importing scores from Football WebPages for gameweek ${gameweek}`);
        
        try {
            // Check if API configuration is available
            if (!this.apiManager || !this.apiManager.footballWebPagesConfig) {
                console.error('❌ API configuration not available');
                alert('API configuration not available. Please check the API settings.');
                return;
            }
            
            // Get the current edition and gameweek
            const edition = this.currentActiveEdition || 'edition1';
            const gameweekKey = gameweek === 'tiebreak' ? 'gwtiebreak' : `gw${gameweek}`;
            const editionGameweekKey = `edition${edition}_${gameweekKey}`;
            
            console.log(`📥 Importing scores for ${editionGameweekKey}`);
            
            // First, get the fixtures for this gameweek from the database
            const fixturesDoc = await this.db.collection('fixtures').doc(editionGameweekKey).get();
            
            if (!fixturesDoc.exists) {
                console.error('❌ No fixtures found for this gameweek');
                alert('No fixtures found for this gameweek. Please import fixtures first.');
                return;
            }
            
            const fixturesData = fixturesDoc.data();
            const fixtures = fixturesData.fixtures || [];
            
            if (fixtures.length === 0) {
                console.error('❌ No fixtures in database for this gameweek');
                alert('No fixtures found in database for this gameweek. Please import fixtures first.');
                return;
            }
            
            console.log(`📥 Found ${fixtures.length} fixtures in database for gameweek ${gameweek}`);
            
            // Get the league and season from the API settings
            const league = document.querySelector('#football-webpages-league')?.value || '5';
            const season = document.querySelector('#football-webpages-season')?.value || '2025-26';
            
            console.log(`📥 Fetching scores for league ${league}, season ${season}`);
            
            // Fetch fixtures from the API to get current scores
            const apiResponse = await fetch(`https://football-web-pages1.p.rapidapi.com/fixtures-results.json?comp=${league}&round=0&team=0`, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': this.apiManager.footballWebPagesConfig.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': this.apiManager.footballWebPagesConfig.RAPIDAPI_HOST
                }
            });
            
            if (!apiResponse.ok) {
                throw new Error(`HTTP ${apiResponse.status}: ${apiResponse.statusText}`);
            }
            
            const apiData = await apiResponse.json();
            console.log('📥 API response received:', apiData);
            
            // Extract fixtures from API response
            let apiFixtures = [];
            if (apiData['fixtures-results']) {
                const fixturesData = apiData['fixtures-results'];
                
                if (Array.isArray(fixturesData)) {
                    apiFixtures = fixturesData;
                } else if (fixturesData.fixtures && Array.isArray(fixturesData.fixtures)) {
                    apiFixtures = fixturesData.fixtures;
                } else if (fixturesData.matches && Array.isArray(fixturesData.matches)) {
                    apiFixtures = fixturesData.matches;
                } else {
                    // Try to find any array in the response
                    const keys = Object.keys(fixturesData);
                    for (const key of keys) {
                        if (Array.isArray(fixturesData[key])) {
                            apiFixtures = fixturesData[key];
                            break;
                        }
                    }
                }
            }
            
            console.log(`📥 Found ${apiFixtures.length} fixtures in API response`);
            
            if (apiFixtures.length === 0) {
                console.error('❌ No fixtures found in API response');
                alert('No fixtures found in API response. Please check the API settings and try again.');
                return;
            }
            
            // Update scores for each fixture in our database
            let updatedCount = 0;
            const updatedFixtures = fixtures.map(fixture => {
                // Find matching fixture in API response with flexible matching
                const apiFixture = apiFixtures.find(apiFixture => {
                    const apiHomeTeam = apiFixture['home-team']?.name || apiFixture.homeTeam || apiFixture.home || 'TBD';
                    const apiAwayTeam = apiFixture['away-team']?.name || apiFixture.awayTeam || apiFixture.away || 'TBD';
                    
                    // Try exact match first
                    if (apiHomeTeam === fixture.homeTeam && apiAwayTeam === fixture.awayTeam) {
                        return true;
                    }
                    
                    // Try case-insensitive match
                    if (apiHomeTeam.toLowerCase() === fixture.homeTeam.toLowerCase() && 
                        apiAwayTeam.toLowerCase() === fixture.awayTeam.toLowerCase()) {
                        return true;
                    }
                    
                    // Try partial match (in case of slight name differences)
                    if (apiHomeTeam.toLowerCase().includes(fixture.homeTeam.toLowerCase()) && 
                        apiAwayTeam.toLowerCase().includes(fixture.awayTeam.toLowerCase())) {
                        return true;
                    }
                    
                    return false;
                });
                
                if (apiFixture) {
                    const apiHomeTeam = apiFixture['home-team']?.name || apiFixture.homeTeam || apiFixture.home || 'TBD';
                    const apiAwayTeam = apiFixture['away-team']?.name || apiFixture.awayTeam || apiFixture.away || 'TBD';
                    console.log(`📥 Found matching fixture: ${fixture.homeTeam} vs ${fixture.awayTeam} (API: ${apiHomeTeam} vs ${apiAwayTeam})`);
                    
                    // Extract scores from API fixture with improved logic
                    let homeScore = null;
                    let awayScore = null;
                    let homeScoreHT = null;
                    let awayScoreHT = null;
                    
                    // Method 1: Direct score properties from home-team/away-team objects
                    if (apiFixture['home-team'] && apiFixture['away-team']) {
                        homeScore = apiFixture['home-team'].score ?? apiFixture['home-team'].goals ?? apiFixture['home-team'].result;
                        awayScore = apiFixture['away-team'].score ?? apiFixture['away-team'].goals ?? apiFixture['away-team'].result;
                    }
                    
                    // Method 2: Alternative score properties
                    if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined)) {
                        homeScore = apiFixture.homeScore ?? apiFixture.homeGoals ?? apiFixture.score1 ?? apiFixture.home_result;
                        awayScore = apiFixture.awayScore ?? apiFixture.awayGoals ?? apiFixture.score2 ?? apiFixture.away_result;
                    }
                    
                    // Method 3: Split score strings (most common format)
                    if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined)) {
                        // Try full-time score first
                        if (apiFixture.ft_score && apiFixture.ft_score.includes('-')) {
                            const ftParts = apiFixture.ft_score.split('-');
                            homeScore = parseInt(ftParts[0].trim());
                            awayScore = parseInt(ftParts[1].trim());
                        }
                        
                        // Try general score field
                        if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined) && apiFixture.score && apiFixture.score.includes('-')) {
                            const scoreParts = apiFixture.score.split('-');
                            homeScore = parseInt(scoreParts[0].trim());
                            awayScore = parseInt(scoreParts[1].trim());
                        }
                        
                        // Try result field
                        if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined) && apiFixture.result && apiFixture.result.includes('-')) {
                            const resultParts = apiFixture.result.split('-');
                            homeScore = parseInt(resultParts[0].trim());
                            awayScore = parseInt(resultParts[1].trim());
                        }
                    }
                    
                    // Method 4: Check for individual goal properties
                    if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined)) {
                        homeScore = apiFixture.homeGoals ?? apiFixture.goals1 ?? apiFixture.home_goals;
                        awayScore = apiFixture.awayGoals ?? apiFixture.goals2 ?? apiFixture.away_goals;
                    }
                    
                    // Method 5: Check for any numeric score-like properties
                    if ((homeScore === null || homeScore === undefined) && (awayScore === null || awayScore === undefined)) {
                        // Look for any property that might contain scores
                        const possibleScoreProps = ['score', 'result', 'goals', 'ft_score', 'ht_score', 'final_score'];
                        for (const prop of possibleScoreProps) {
                            if (apiFixture[prop] && typeof apiFixture[prop] === 'string' && apiFixture[prop].includes('-')) {
                                const parts = apiFixture[prop].split('-');
                                if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                                    homeScore = parseInt(parts[0].trim());
                                    awayScore = parseInt(parts[1].trim());
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Extract half-time scores
                    // Method 1: Check home-team and away-team objects for half-time-score
                    if (apiFixture['home-team'] && apiFixture['away-team']) {
                        homeScoreHT = apiFixture['home-team']['half-time-score'] ?? apiFixture['home-team']['ht_score'] ?? apiFixture['home-team']['half_time_score'];
                        awayScoreHT = apiFixture['away-team']['half-time-score'] ?? apiFixture['away-team']['ht_score'] ?? apiFixture['away-team']['half_time_score'];
                    }
                    
                    // Method 2: Check top-level properties
                    if ((homeScoreHT === null || homeScoreHT === undefined) && (awayScoreHT === null || awayScoreHT === undefined)) {
                        if (apiFixture.ht_score && apiFixture.ht_score.includes('-')) {
                            const htParts = apiFixture.ht_score.split('-');
                            homeScoreHT = parseInt(htParts[0].trim());
                            awayScoreHT = parseInt(htParts[1].trim());
                        } else if (apiFixture.half_time_score && apiFixture.half_time_score.includes('-')) {
                            const htParts = apiFixture.half_time_score.split('-');
                            homeScoreHT = parseInt(htParts[0].trim());
                            awayScoreHT = parseInt(htParts[1].trim());
                        } else if (apiFixture.ht_result && apiFixture.ht_result.includes('-')) {
                            const htParts = apiFixture.ht_result.split('-');
                            homeScoreHT = parseInt(htParts[0].trim());
                            awayScoreHT = parseInt(htParts[1].trim());
                        }
                    }
                    
                    // Method 3: Check for halfTimeScore properties (from netlify function)
                    if ((homeScoreHT === null || homeScoreHT === undefined) && (awayScoreHT === null || awayScoreHT === undefined)) {
                        if (apiFixture.halfTimeScore && apiFixture.halfTimeScore.includes('-')) {
                            const htParts = apiFixture.halfTimeScore.split('-');
                            homeScoreHT = parseInt(htParts[0].trim());
                            awayScoreHT = parseInt(htParts[1].trim());
                        }
                    }
                    
                    // Method 4: Check for halfTime properties (from netlify function)
                    if ((homeScoreHT === null || homeScoreHT === undefined) && (awayScoreHT === null || awayScoreHT === undefined)) {
                        if (apiFixture.halfTime && apiFixture.halfTime.includes('-')) {
                            const htParts = apiFixture.halfTime.split('-');
                            homeScoreHT = parseInt(htParts[0].trim());
                            awayScoreHT = parseInt(htParts[1].trim());
                        }
                    }
                    
                    // Method 5: Check for ht properties (from netlify function)
                    if ((homeScoreHT === null || homeScoreHT === undefined) && (awayScoreHT === null || awayScoreHT === undefined)) {
                        if (apiFixture.ht && apiFixture.ht.includes('-')) {
                            const htParts = apiFixture.ht.split('-');
                            homeScoreHT = parseInt(htParts[0].trim());
                            awayScoreHT = parseInt(htParts[1].trim());
                        }
                    }
                    
                    // Method 6: Check for any property containing 'half' or 'ht' that might have scores
                    if ((homeScoreHT === null || homeScoreHT === undefined) && (awayScoreHT === null || awayScoreHT === undefined)) {
                        const possibleHTProps = ['halfTimeScore', 'halfTime', 'ht', 'ht_score', 'half_time_score', 'ht_result', 'halfTimeResult'];
                        for (const prop of possibleHTProps) {
                            if (apiFixture[prop] && typeof apiFixture[prop] === 'string' && apiFixture[prop].includes('-')) {
                                const parts = apiFixture[prop].split('-');
                                if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
                                    homeScoreHT = parseInt(parts[0].trim());
                                    awayScoreHT = parseInt(parts[1].trim());
                                    break;
                                }
                            }
                        }
                    }
                    
                    // Convert to numbers and handle invalid values
                    homeScore = homeScore !== null && homeScore !== undefined && homeScore !== '' ? parseInt(homeScore) : null;
                    awayScore = awayScore !== null && awayScore !== undefined && awayScore !== '' ? parseInt(awayScore) : null;
                    homeScoreHT = homeScoreHT !== null && homeScoreHT !== undefined && homeScoreHT !== '' ? parseInt(homeScoreHT) : null;
                    awayScoreHT = awayScoreHT !== null && awayScoreHT !== undefined && awayScoreHT !== '' ? parseInt(awayScoreHT) : null;
                    
                    // Extract status from API fixture and update based on scores
                    let status = apiFixture.status?.full || apiFixture.status?.short || fixture.status || 'NS';
                    
                    // If we have full-time scores, automatically set status to FT
                    if (homeScore !== null && awayScore !== null) {
                        status = 'FT';
                    }
                    
                    console.log(`📥 Updating scores: ${fixture.homeTeam} ${homeScore} - ${awayScore} ${fixture.awayTeam} (Status: ${status})`);
                    console.log(`📥 Half-time scores: ${fixture.homeTeam} ${homeScoreHT} - ${awayScoreHT} ${fixture.awayTeam}`);
                    
                    updatedCount++;
                    
                    return {
                        ...fixture,
                        homeScore: homeScore,
                        awayScore: awayScore,
                        homeScoreHT: homeScoreHT,
                        awayScoreHT: awayScoreHT,
                        status: status,
                        completed: (homeScore !== null && awayScore !== null), // Also set completed flag
                        lastUpdated: new Date()
                    };
                } else {
                    console.log(`⚠️ No matching fixture found in API for: ${fixture.homeTeam} vs ${fixture.awayTeam}`);
                    return fixture;
                }
            });
            
            // Save updated fixtures back to database
            await this.db.collection('fixtures').doc(editionGameweekKey).update({
                fixtures: updatedFixtures,
                lastUpdated: new Date(),
                scoresImportedFrom: 'Football Web Pages API'
            });
            
            console.log(`✅ Successfully updated ${updatedCount} out of ${fixtures.length} fixtures with scores from API`);
            
            // Process results to update player lives
            console.log('🔄 Processing results to update player lives...');
            if (window.app && window.app.scoresManager && window.app.scoresManager.statisticsEngine) {
                try {
                    await window.app.scoresManager.statisticsEngine.processResults(gameweek, updatedFixtures);
                    console.log('✅ Results processed successfully - player lives updated');
                } catch (processError) {
                    console.warn('⚠️ Could not process results automatically:', processError);
                }
            }
            
            // Show success message
            alert(`Successfully imported scores for ${updatedCount} out of ${fixtures.length} fixtures from Football Web Pages API!`);
            
            // Automatically refresh the admin scores display
            console.log('🔄 Automatically refreshing admin scores display...');
            
            // Check if we're in the admin scores tab and refresh the display
            const isAdminScoresTab = document.querySelector('#scores-container') && 
                                   document.querySelector('#scores-container').closest('.gameweek-fixtures-section');
            
            if (isAdminScoresTab && window.app && window.app.scoresManager) {
                try {
                    // Reload scores and refresh the admin display
                    const currentGameweek = document.querySelector('#score-gameweek-select')?.value || '1';
                    const fixtures = await window.app.scoresManager.loadScoresForGameweek();
                    
                    if (window.app.scoresManager.statisticsEngine) {
                        await window.app.scoresManager.statisticsEngine.renderAdminScores(fixtures, currentGameweek);
                        console.log('✅ Admin scores display refreshed automatically');
                    }
                } catch (refreshError) {
                    console.warn('⚠️ Could not automatically refresh admin scores display:', refreshError);
                }
            } else {
                console.log('Scores imported successfully. Please refresh the scores display manually.');
            }
            
            // Automatically refresh the As It Stands tab if it's open
            console.log('🔄 Checking if As It Stands tab needs refresh...');
            const asItStandsTab = document.querySelector('#as-it-stands-tab');
            if (asItStandsTab && asItStandsTab.classList.contains('active') && window.app && window.app.adminManagementManager) {
                try {
                    console.log('🔄 Refreshing As It Stands tab automatically...');
                    await window.app.adminManagementManager.loadStandings();
                    console.log('✅ As It Stands tab refreshed automatically');
                } catch (standingsError) {
                    console.warn('⚠️ Could not automatically refresh As It Stands tab:', standingsError);
                }
            } else {
                console.log('As It Stands tab not active or admin management not available');
            }
            
            // Update status message if available
            const statusElement = document.querySelector('#import-status');
            if (statusElement) {
                statusElement.textContent = `Successfully imported scores for ${updatedCount} fixtures from Football Web Pages API`;
                statusElement.className = 'status-message success';
            }
            
        } catch (error) {
            console.error('❌ Error importing scores from Football WebPages:', error);
            alert('Error importing scores from Football WebPages: ' + error.message);
            
            // Update status message if available
            const statusElement = document.querySelector('#import-status');
            if (statusElement) {
                statusElement.textContent = 'Error importing scores: ' + error.message;
                statusElement.className = 'status-message error';
            }
        }
    }

    // Test API function for debugging (exposed globally)
    async testFootballWebPagesAPI() {
        console.log('🧪 Testing Football Web Pages API...');
        try {
            if (!this.apiManager || !this.apiManager.footballWebPagesConfig) {
                console.error('❌ API configuration not available');
                return;
            }
            
            const response = await fetch('https://football-web-pages1.p.rapidapi.com/fixtures-results.json?comp=5', {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': this.apiManager.footballWebPagesConfig.RAPIDAPI_KEY,
                    'X-RapidAPI-Host': this.apiManager.footballWebPagesConfig.RAPIDAPI_HOST
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('🧪 API Response Structure:', data);
            
            if (data['fixtures-results'] && data['fixtures-results'].matches) {
                console.log('🧪 Found matches:', data['fixtures-results'].matches.length);
                if (data['fixtures-results'].matches.length > 0) {
                    console.log('🧪 First match:', data['fixtures-results'].matches[0]);
                }
            }
            
            return data;
        } catch (error) {
            console.error('❌ Error testing API:', error);
        }
    }

    // Cleanup resources
    cleanup() {
        // No specific cleanup needed for this module
    }
}
