CREATE OR REPLACE VIEW vw_geno_nexus_matrix AS
WITH 
-- 1. DNA File & Storage Aggregation per User
UserStorage AS (
    SELECT 
        user_id,
        COUNT(id) AS total_files_uploaded,
        SUM(file_size) AS total_bytes_stored,
        COUNT(patient_metadata) AS profiles_with_clinical_data,
        MAX(created_at) AS last_file_upload_at
    FROM dna_files
    GROUP BY user_id
),

-- 2. Pipeline Run Performance per User
UserPipelines AS (
    SELECT 
        user_id,
        COUNT(id) AS total_pipeline_runs,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) AS failed_pipelines,
        AVG(progress) AS avg_pipeline_progress
    FROM pipeline_runs
    GROUP BY user_id
),

-- 3. Collaboration & Hypothesis Insights
UserCollaboration AS (
    SELECT 
        h.user_id,
        COUNT(h.id) AS total_hypotheses_created,
        AVG(h.confidence) AS avg_hypothesis_confidence,
        SUM(h.comments) AS total_hypothesis_comments,
        COUNT(hm.id) AS total_messages_contributed
    FROM hypotheses h
    LEFT JOIN hypothesis_messages hm ON h.id = hm.hypothesis_id 
    GROUP BY h.user_id
),

-- 4. Latest Genomic Comparison Result per User using Window Functions
LatestComparisons AS (
    SELECT 
        r.user_id,
        cr.detected_organism,
        cr.match_percentage,
        cr.alignment_score,
        qf.file_name AS query_file,
        RANK() OVER (PARTITION BY r.user_id ORDER BY cr.created_at DESC) as recent_rank
    FROM reports r
    INNER JOIN comparison_results cr ON r.comparison_id = cr.id
    INNER JOIN dna_files qf ON cr.query_file_id = qf.id
    WHERE cr.status = 'completed'
),

-- 5. Outbreak & Alert Correlation
UserAlerts AS (
    SELECT 
        user_id,
        COUNT(id) AS total_critical_alerts,
        COUNT(CASE WHEN dismissed = FALSE THEN 1 END) AS active_alerts
    FROM collab_alerts
    WHERE type = 'critical'
    GROUP BY user_id
),

-- 6. Security & Audit Trail
UserAuditSummary AS (
    SELECT 
        user_id,
        COUNT(id) AS total_audit_events,
        COUNT(CASE WHEN event_type LIKE '%failed%' THEN 1 END) AS suspicious_events,
        MAX(created_at) AS last_audit_event_at
    FROM audit_logs
    GROUP BY user_id
),

-- 7. User Notifications Activity (NEW)
UserNotificationsActivity AS (
    SELECT 
        user_id,
        COUNT(id) AS total_notifications,
        COUNT(CASE WHEN is_read = false THEN 1 END) AS unread_notifications
    FROM user_notifications
    GROUP BY user_id
),

-- 8. Private Chat Activity (NEW)
PrivateChatActivity AS (
    SELECT 
        sender_id AS user_id,
        COUNT(id) AS messages_sent
    FROM private_messages
    GROUP BY sender_id
),

-- 9. Latest Session Tracking (NEW)
LatestSessions AS (
    SELECT 
        user_id,
        MAX(last_seen_at) AS most_recent_activity_at
    FROM sessions
    GROUP BY user_id
)

-- ============================================================================
-- MAIN SELECT COMBINING ALL 9 CTEs WITH BASE TABLES
-- ============================================================================
SELECT 
    -- User Core Info
    u.id AS user_id,
    u.first_name || ' ' || u.last_name AS full_name,
    u.email,
    u.account_category,
    u.organization,
    u.job_title,
    
    -- Profile & Settings
    usets.theme,
    usets.auto_analysis AS auto_analysis_enabled,
    
    -- Activity Metrics (NEW)
    ls.most_recent_activity_at,
    COALESCE(notif.unread_notifications, 0) AS unread_notifications,
    COALESCE(chat.messages_sent, 0) AS private_messages_sent,
    
    -- Storage & DNA Metrics
    COALESCE(us.total_files_uploaded, 0) AS total_dna_files,
    COALESCE(us.total_bytes_stored, 0) AS total_storage_bytes,
    COALESCE(us.profiles_with_clinical_data, 0) AS clinical_profiles_linked,
    
    -- Pipeline Reliability
    COALESCE(up.total_pipeline_runs, 0) AS total_pipelines,
    COALESCE(up.failed_pipelines, 0) AS failed_pipelines,
    CASE 
        WHEN up.total_pipeline_runs > 0 
        THEN ROUND((1.0 - (up.failed_pipelines::NUMERIC / up.total_pipeline_runs::NUMERIC)) * 100, 2) 
        ELSE 100.00 
    END AS pipeline_success_rate,
    
    -- Collaboration & AI
    COALESCE(uc.total_hypotheses_created, 0) AS active_hypotheses,
    ROUND(COALESCE(uc.avg_hypothesis_confidence, 0), 2) AS avg_confidence_score,
    COALESCE(uc.total_hypothesis_comments, 0) AS network_engagement_score,
    
    -- Latest Genomic Analysis Context
    lc.detected_organism AS last_detected_pathogen,
    lc.match_percentage AS last_match_percentage,
    lc.query_file AS last_analyzed_file,
    
    -- Risk & Alerts
    COALESCE(ua.active_alerts, 0) AS unresolved_critical_alerts,
    
    -- Forecasting Intersection
    -- Cross-references the pathogen detected in the user's latest analysis 
    -- against global outbreak forecasts within the last 30 days
    CASE 
        WHEN obf.pathogen IS NOT NULL THEN 'High Global Risk (Active Outbreak Forecast)'
        ELSE 'Monitor'
    END AS regional_outbreak_risk,
    
    -- Security Posture
    COALESCE(aud.suspicious_events, 0) AS security_flags,
    CASE 
        WHEN u.two_factor_enabled = TRUE THEN 'Secure'
        WHEN COALESCE(aud.suspicious_events, 0) > 3 THEN 'At Risk'
        ELSE 'Standard'
    END AS security_status,
    
    u.created_at AS account_created_on
    
FROM users u
LEFT JOIN user_settings usets 
    ON u.id = usets.user_id
LEFT JOIN UserStorage us 
    ON u.id = us.user_id
LEFT JOIN UserPipelines up 
    ON u.id = up.user_id
LEFT JOIN UserCollaboration uc 
    ON u.id = uc.user_id
LEFT JOIN LatestComparisons lc 
    ON u.id = lc.user_id AND lc.recent_rank = 1
LEFT JOIN UserAlerts ua 
    ON u.id = ua.user_id
LEFT JOIN UserAuditSummary aud 
    ON u.id = aud.user_id
LEFT JOIN UserNotificationsActivity notif 
    ON u.id = notif.user_id
LEFT JOIN PrivateChatActivity chat 
    ON u.id = chat.user_id
LEFT JOIN LatestSessions ls 
    ON u.id = ls.user_id
-- Complex logic joining user's data context with global forecast data
LEFT JOIN outbreak_forecasts obf 
    ON lc.detected_organism = obf.pathogen 
    AND obf.created_at >= NOW() - INTERVAL '30 days';

-- Documenting the view
COMMENT ON VIEW vw_geno_nexus_matrix IS 'Comprehensive matrix of user genomic interactions, collaborations, security, chat, notifications, and pipeline analytics.';

-- Granting permissions
GRANT SELECT ON vw_geno_nexus_matrix TO PUBLIC;
