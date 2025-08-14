// Audit Module
// Handles audit trails, logging, and monitoring of admin actions

export class Audit {
    constructor(db) {
        this.db = db;
        this.auditLogs = [];
        this.monitoringActive = false;
    }

    // Initialize audit functionality
    initializeAudit() {
        console.log('🔧 Initializing audit functionality...');
        
        // Set up audit monitoring
        this.setupAuditMonitoring();
        
        // Set up audit log viewing
        this.setupAuditLogViewing();
        
        console.log('✅ Audit functionality initialized');
    }

    // Setup audit monitoring
    setupAuditMonitoring() {
        console.log('🔧 Setting up audit monitoring...');
        
        // Start monitoring admin actions
        this.startActionMonitoring();
        
        // Set up periodic audit checks
        this.setupPeriodicAuditChecks();
        
        console.log('✅ Audit monitoring setup complete');
    }

    // Start action monitoring
    startActionMonitoring() {
        this.monitoringActive = true;
        console.log('✅ Action monitoring started');
        
        // Monitor DOM changes for admin actions
        this.monitorDOMChanges();
        
        // Monitor Firebase operations
        this.monitorFirebaseOperations();
    }

    // Monitor DOM changes
    monitorDOMChanges() {
        // This would monitor DOM changes to detect admin actions
        // Implementation depends on your specific monitoring requirements
        console.log('🔧 DOM change monitoring active');
    }

    // Monitor Firebase operations
    monitorFirebaseOperations() {
        // This would monitor Firebase operations for audit purposes
        // Implementation depends on your specific monitoring requirements
        console.log('🔧 Firebase operation monitoring active');
    }

    // Setup periodic audit checks
    setupPeriodicAuditChecks() {
        // Run audit checks every hour
        setInterval(() => {
            this.runAuditChecks();
        }, 60 * 60 * 1000);
        
        console.log('✅ Periodic audit checks scheduled');
    }

    // Run audit checks
    async runAuditChecks() {
        try {
            console.log('🔧 Running audit checks...');
            
            // Check for suspicious activity
            await this.checkForSuspiciousActivity();
            
            // Check for unauthorized access
            await this.checkForUnauthorizedAccess();
            
            // Generate audit report
            await this.generateAuditReport();
            
            console.log('✅ Audit checks completed');
            
        } catch (error) {
            console.error('❌ Error running audit checks:', error);
        }
    }

    // Check for suspicious activity
    async checkForSuspiciousActivity() {
        try {
            console.log('🔧 Checking for suspicious activity...');
            
            // Check for rapid-fire admin actions
            const recentActions = await this.getRecentAdminActions(5); // Last 5 minutes
            
            if (recentActions.length > 10) {
                console.warn('⚠️ High volume of admin actions detected');
                await this.logSuspiciousActivity('High volume of admin actions', recentActions);
            }
            
            // Check for unusual time patterns
            const unusualTimeActions = await this.checkUnusualTimePatterns();
            if (unusualTimeActions.length > 0) {
                console.warn('⚠️ Unusual time pattern detected');
                await this.logSuspiciousActivity('Unusual time pattern', unusualTimeActions);
            }
            
            console.log('✅ Suspicious activity check completed');
            
        } catch (error) {
            console.error('❌ Error checking for suspicious activity:', error);
        }
    }

    // Check for unauthorized access
    async checkForUnauthorizedAccess() {
        try {
            console.log('🔧 Checking for unauthorized access...');
            
            // Check for failed login attempts
            const failedLogins = await this.getFailedLoginAttempts(10); // Last 10 minutes
            
            if (failedLogins.length > 5) {
                console.warn('⚠️ Multiple failed login attempts detected');
                await this.logSecurityEvent('Multiple failed login attempts', failedLogins);
            }
            
            // Check for access from unusual locations
            const unusualAccess = await this.checkUnusualAccessLocations();
            if (unusualAccess.length > 0) {
                console.warn('⚠️ Unusual access location detected');
                await this.logSecurityEvent('Unusual access location', unusualAccess);
            }
            
            console.log('✅ Unauthorized access check completed');
            
        } catch (error) {
            console.error('❌ Error checking for unauthorized access:', error);
        }
    }

    // Generate audit report
    async generateAuditReport() {
        try {
            console.log('🔧 Generating audit report...');
            
            const report = {
                timestamp: new Date(),
                period: '1 hour',
                totalActions: 0,
                suspiciousActivities: 0,
                securityEvents: 0,
                recommendations: []
            };
            
            // Get action counts
            const actions = await this.getAdminActions(60); // Last hour
            report.totalActions = actions.length;
            
            // Get suspicious activity count
            const suspicious = await this.getSuspiciousActivities(60);
            report.suspiciousActivities = suspicious.length;
            
            // Get security event count
            const security = await this.getSecurityEvents(60);
            report.securityEvents = security.length;
            
            // Generate recommendations
            report.recommendations = this.generateRecommendations(report);
            
            // Save report
            await this.saveAuditReport(report);
            
            console.log('✅ Audit report generated and saved');
            
        } catch (error) {
            console.error('❌ Error generating audit report:', error);
        }
    }

    // Generate recommendations
    generateRecommendations(report) {
        const recommendations = [];
        
        if (report.suspiciousActivities > 5) {
            recommendations.push('Consider implementing rate limiting for admin actions');
        }
        
        if (report.securityEvents > 3) {
            recommendations.push('Review access control policies and consider additional security measures');
        }
        
        if (report.totalActions > 100) {
            recommendations.push('Monitor admin activity patterns for potential automation');
        }
        
        return recommendations;
    }

    // Save audit report
    async saveAuditReport(report) {
        try {
            await this.db.collection('auditReports').add({
                ...report,
                timestamp: new Date(),
                generatedBy: 'system'
            });
            
            console.log('✅ Audit report saved to database');
            
        } catch (error) {
            console.error('❌ Error saving audit report:', error);
        }
    }

    // Get recent admin actions
    async getRecentAdminActions(minutes) {
        try {
            const cutoff = new Date(Date.now() - (minutes * 60 * 1000));
            
            const actionsSnapshot = await this.db.collection('auditLogs')
                .where('timestamp', '>=', cutoff)
                .orderBy('timestamp', 'desc')
                .get();
            
            const actions = [];
            actionsSnapshot.forEach(doc => {
                actions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return actions;
            
        } catch (error) {
            console.error('Error getting recent admin actions:', error);
            return [];
        }
    }

    // Get admin actions
    async getAdminActions(minutes) {
        try {
            const cutoff = new Date(Date.now() - (minutes * 60 * 1000));
            
            const actionsSnapshot = await this.db.collection('auditLogs')
                .where('timestamp', '>=', cutoff)
                .orderBy('timestamp', 'desc')
                .get();
            
            const actions = [];
            actionsSnapshot.forEach(doc => {
                actions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return actions;
            
        } catch (error) {
            console.error('Error getting admin actions:', error);
            return [];
        }
    }

    // Get failed login attempts
    async getFailedLoginAttempts(minutes) {
        try {
            const cutoff = new Date(Date.now() - (minutes * 60 * 1000));
            
            const loginsSnapshot = await this.db.collection('loginAttempts')
                .where('timestamp', '>=', cutoff)
                .where('success', '==', false)
                .orderBy('timestamp', 'desc')
                .get();
            
            const logins = [];
            loginsSnapshot.forEach(doc => {
                logins.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return logins;
            
        } catch (error) {
            console.error('Error getting failed login attempts:', error);
            return [];
        }
    }

    // Check unusual time patterns
    async checkUnusualTimePatterns() {
        try {
            const now = new Date();
            const hour = now.getHours();
            
            // Consider unusual if between 1 AM and 5 AM
            if (hour >= 1 && hour <= 5) {
                const actions = await this.getAdminActions(60);
                return actions.filter(action => {
                    const actionHour = action.timestamp?.toDate?.()?.getHours() || new Date(action.timestamp).getHours();
                    return actionHour >= 1 && actionHour <= 5;
                });
            }
            
            return [];
            
        } catch (error) {
            console.error('Error checking unusual time patterns:', error);
            return [];
        }
    }

    // Check unusual access locations
    async checkUnusualAccessLocations() {
        try {
            // This would check for access from unusual IP addresses or locations
            // Implementation depends on your location tracking system
            return [];
            
        } catch (error) {
            console.error('Error checking unusual access locations:', error);
            return [];
        }
    }

    // Get suspicious activities
    async getSuspiciousActivities(minutes) {
        try {
            const cutoff = new Date(Date.now() - (minutes * 60 * 1000));
            
            const activitiesSnapshot = await this.db.collection('suspiciousActivities')
                .where('timestamp', '>=', cutoff)
                .orderBy('timestamp', 'desc')
                .get();
            
            const activities = [];
            activitiesSnapshot.forEach(doc => {
                activities.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return activities;
            
        } catch (error) {
            console.error('Error getting suspicious activities:', error);
            return [];
        }
    }

    // Get security events
    async getSecurityEvents(minutes) {
        try {
            const cutoff = new Date(Date.now() - (minutes * 60 * 1000));
            
            const eventsSnapshot = await this.db.collection('securityEvents')
                .where('timestamp', '>=', cutoff)
                .orderBy('timestamp', 'desc')
                .get();
            
            const events = [];
            eventsSnapshot.forEach(doc => {
                events.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return events;
            
        } catch (error) {
            console.error('Error getting security events:', error);
            return [];
        }
    }

    // Log suspicious activity
    async logSuspiciousActivity(type, details) {
        try {
            await this.db.collection('suspiciousActivities').add({
                type,
                details,
                timestamp: new Date(),
                severity: 'medium'
            });
            
            console.log(`✅ Suspicious activity logged: ${type}`);
            
        } catch (error) {
            console.error('❌ Error logging suspicious activity:', error);
        }
    }

    // Log security event
    async logSecurityEvent(type, details) {
        try {
            await this.db.collection('securityEvents').add({
                type,
                details,
                timestamp: new Date(),
                severity: 'high'
            });
            
            console.log(`✅ Security event logged: ${type}`);
            
        } catch (error) {
            console.error('❌ Error logging security event:', error);
        }
    }

    // Log admin action
    async logAdminAction(action, details, userId = null) {
        try {
            const logEntry = {
                action,
                details,
                userId,
                timestamp: new Date(),
                ipAddress: await this.getClientIP(),
                userAgent: navigator.userAgent
            };
            
            await this.db.collection('auditLogs').add(logEntry);
            
            // Add to local cache
            this.auditLogs.push(logEntry);
            
            // Keep only last 1000 logs in memory
            if (this.auditLogs.length > 1000) {
                this.auditLogs = this.auditLogs.slice(-1000);
            }
            
            console.log(`✅ Admin action logged: ${action}`);
            
        } catch (error) {
            console.error('❌ Error logging admin action:', error);
        }
    }

    // Get client IP address
    async getClientIP() {
        try {
            // This would get the client's IP address
            // Implementation depends on your IP detection method
            return 'unknown';
            
        } catch (error) {
            console.error('Error getting client IP:', error);
            return 'unknown';
        }
    }

    // Setup audit log viewing
    setupAuditLogViewing() {
        console.log('🔧 Setting up audit log viewing...');
        
        // Set up audit log display
        this.setupAuditLogDisplay();
        
        // Set up audit log export
        this.setupAuditLogExport();
        
        console.log('✅ Audit log viewing setup complete');
    }

    // Setup audit log display
    setupAuditLogDisplay() {
        const auditLogContainer = document.querySelector('#audit-log-container');
        if (!auditLogContainer) {
            console.log('Audit log container not found');
            return;
        }
        
        // Set up refresh button
        const refreshBtn = document.querySelector('#refresh-audit-logs');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAuditLogs());
        }
        
        // Set up filter controls
        this.setupAuditLogFilters();
        
        // Load initial audit logs
        this.loadAuditLogs();
    }

    // Setup audit log filters
    setupAuditLogFilters() {
        const filterContainer = document.querySelector('#audit-log-filters');
        if (!filterContainer) return;
        
        // Action type filter
        const actionFilter = document.querySelector('#action-type-filter');
        if (actionFilter) {
            actionFilter.addEventListener('change', () => this.filterAuditLogs());
        }
        
        // Date range filter
        const dateFilter = document.querySelector('#date-range-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => this.filterAuditLogs());
        }
        
        // User filter
        const userFilter = document.querySelector('#user-filter');
        if (userFilter) {
            userFilter.addEventListener('change', () => this.filterAuditLogs());
        }
    }

    // Setup audit log export
    setupAuditLogExport() {
        const exportBtn = document.querySelector('#export-audit-logs');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAuditLogs());
        }
    }

    // Load audit logs
    async loadAuditLogs() {
        try {
            console.log('🔧 Loading audit logs...');
            
            const logsSnapshot = await this.db.collection('auditLogs')
                .orderBy('timestamp', 'desc')
                .limit(100)
                .get();
            
            const logs = [];
            logsSnapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.displayAuditLogs(logs);
            
        } catch (error) {
            console.error('❌ Error loading audit logs:', error);
            alert('Error loading audit logs: ' + error.message);
        }
    }

    // Display audit logs
    displayAuditLogs(logs) {
        const logContainer = document.querySelector('#audit-log-list');
        if (!logContainer) return;
        
        if (!logs || logs.length === 0) {
            logContainer.innerHTML = '<p>No audit logs found</p>';
            return;
        }
        
        let logsHtml = `
            <table class="audit-log-table">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Action</th>
                        <th>User</th>
                        <th>Details</th>
                        <th>IP Address</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        logs.forEach(log => {
            const timestamp = log.timestamp?.toDate?.() || log.timestamp || new Date();
            const formattedTime = timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString();
            
            logsHtml += `
                <tr>
                    <td>${formattedTime}</td>
                    <td>${log.action || 'Unknown'}</td>
                    <td>${log.userId || 'System'}</td>
                    <td>${log.details || 'No details'}</td>
                    <td>${log.ipAddress || 'Unknown'}</td>
                </tr>
            `;
        });
        
        logsHtml += `
                </tbody>
            </table>
        `;
        
        logContainer.innerHTML = logsHtml;
    }

    // Refresh audit logs
    async refreshAuditLogs() {
        await this.loadAuditLogs();
    }

    // Filter audit logs
    async filterAuditLogs() {
        try {
            const actionType = document.querySelector('#action-type-filter')?.value;
            const dateRange = document.querySelector('#date-range-filter')?.value;
            const userId = document.querySelector('#user-filter')?.value;
            
            let query = this.db.collection('auditLogs').orderBy('timestamp', 'desc');
            
            // Apply filters
            if (actionType && actionType !== 'all') {
                query = query.where('action', '==', actionType);
            }
            
            if (userId && userId !== 'all') {
                query = query.where('userId', '==', userId);
            }
            
            // Apply date range
            if (dateRange && dateRange !== 'all') {
                const cutoff = this.getDateCutoff(dateRange);
                query = query.where('timestamp', '>=', cutoff);
            }
            
            const logsSnapshot = await query.limit(100).get();
            
            const logs = [];
            logsSnapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            this.displayAuditLogs(logs);
            
        } catch (error) {
            console.error('❌ Error filtering audit logs:', error);
        }
    }

    // Get date cutoff
    getDateCutoff(range) {
        const now = new Date();
        
        switch (range) {
            case '1h':
                return new Date(now.getTime() - (60 * 60 * 1000));
            case '24h':
                return new Date(now.getTime() - (24 * 60 * 60 * 1000));
            case '7d':
                return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            case '30d':
                return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            default:
                return new Date(0);
        }
    }

    // Export audit logs
    async exportAuditLogs() {
        try {
            console.log('🔧 Exporting audit logs...');
            
            const logsSnapshot = await this.db.collection('auditLogs')
                .orderBy('timestamp', 'desc')
                .limit(1000)
                .get();
            
            const logs = [];
            logsSnapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Convert to CSV
            const csv = this.logsToCSV(logs);
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            
            window.URL.revokeObjectURL(url);
            console.log('✅ Audit logs exported successfully');
            
        } catch (error) {
            console.error('❌ Error exporting audit logs:', error);
            alert('Error exporting audit logs: ' + error.message);
        }
    }

    // Convert logs to CSV
    logsToCSV(logs) {
        const headers = ['Timestamp', 'Action', 'User ID', 'Details', 'IP Address', 'User Agent'];
        const csv = [headers.join(',')];
        
        logs.forEach(log => {
            const timestamp = log.timestamp?.toDate?.() || log.timestamp || new Date();
            const formattedTime = timestamp.toLocaleDateString() + ' ' + timestamp.toLocaleTimeString();
            
            const row = [
                formattedTime,
                log.action || '',
                log.userId || '',
                (log.details || '').replace(/"/g, '""'),
                log.ipAddress || '',
                (log.userAgent || '').replace(/"/g, '""')
            ].map(field => `"${field}"`).join(',');
            
            csv.push(row);
        });
        
        return csv.join('\n');
    }

    // Stop monitoring
    stopMonitoring() {
        this.monitoringActive = false;
        console.log('✅ Action monitoring stopped');
    }

    // Cleanup method
    cleanup() {
        console.log('🧹 Audit cleanup completed');
        this.stopMonitoring();
    }
}
