-- ============================================================================
-- A/B Testing Schema for ComedyInsight
-- ============================================================================

-- Experiment assignments table
CREATE TABLE IF NOT EXISTS experiment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    experiment_name VARCHAR(100) NOT NULL,
    variant VARCHAR(50) NOT NULL,  -- 'control', 'treatment_A', 'treatment_B', etc.
    assignment_method VARCHAR(50) NOT NULL DEFAULT 'random',  -- 'random', 'cookies', 'user_id'
    metadata JSONB DEFAULT '{}'::jsonb,  -- Additional experiment parameters
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,  -- Optional expiry
    
    -- Ensure one assignment per user per experiment
    UNIQUE(user_id, experiment_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_user ON experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment ON experiment_assignments(experiment_name, variant);
CREATE INDEX IF NOT EXISTS idx_experiment_assignments_assigned ON experiment_assignments(assigned_at);

-- Experiment metadata table
CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',  -- 'draft', 'active', 'paused', 'completed'
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    variants JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of variant definitions
    traffic_allocation INTEGER NOT NULL DEFAULT 100,  -- Percentage (0-100)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Experiment metrics tracking
CREATE TABLE IF NOT EXISTS experiment_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_name VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    variant VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,  -- 'view', 'click', 'play', 'subscribe', 'watch_time'
    metric_value NUMERIC(12,2),  -- Optional numeric value (e.g., watch time in seconds)
    metadata JSONB DEFAULT '{}'::jsonb,  -- Additional metric data
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for experiment metrics
CREATE INDEX IF NOT EXISTS idx_experiment_metrics_exp ON experiment_metrics(experiment_name, variant);
CREATE INDEX IF NOT EXISTS idx_experiment_metrics_user ON experiment_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_metrics_name ON experiment_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_experiment_metrics_recorded ON experiment_metrics(recorded_at);

-- ============================================================================
-- FUNCTIONS FOR A/B TESTING
-- ============================================================================

-- Function to assign user to experiment variant
CREATE OR REPLACE FUNCTION assign_to_experiment(
    p_user_id UUID,
    p_experiment_name VARCHAR,
    p_traffic_percentage INTEGER DEFAULT 100
)
RETURNS VARCHAR AS $$
DECLARE
    v_variant VARCHAR;
    v_hash BIGINT;
    v_experiment_conf RECORD;
    v_existing_assignment VARCHAR;
BEGIN
    -- Check if user already assigned
    SELECT variant INTO v_existing_assignment
    FROM experiment_assignments
    WHERE user_id = p_user_id 
        AND experiment_name = p_experiment_name
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);
    
    IF v_existing_assignment IS NOT NULL THEN
        RETURN v_existing_assignment;
    END IF;
    
    -- Get experiment configuration
    SELECT * INTO v_experiment_conf
    FROM experiments
    WHERE name = p_experiment_name 
        AND status = 'active'
        AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP)
        AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP);
    
    IF v_experiment_conf IS NULL THEN
        RETURN 'control';
    END IF;
    
    -- Check traffic allocation
    IF random() * 100 > p_traffic_percentage THEN
        RETURN 'control';
    END IF;
    
    -- Determine variant using consistent hashing
    -- Hash: user_id + experiment_name for consistency
    v_hash := abs(hashtext(p_user_id::TEXT || p_experiment_name));
    
    -- Assign based on hash (modulo number of variants)
    -- Assuming 50/50 split for 'control' and 'treatment'
    v_variant := CASE 
        WHEN v_hash % 2 = 0 THEN 'control'
        ELSE 'treatment'
    END;
    
    -- Store assignment
    INSERT INTO experiment_assignments (user_id, experiment_name, variant)
    VALUES (p_user_id, p_experiment_name, v_variant)
    ON CONFLICT (user_id, experiment_name) 
    DO UPDATE SET 
        variant = EXCLUDED.variant,
        assigned_at = CURRENT_TIMESTAMP;
    
    RETURN v_variant;
END;
$$ LANGUAGE plpgsql;

-- Function to record experiment metric
CREATE OR REPLACE FUNCTION record_experiment_metric(
    p_user_id UUID,
    p_experiment_name VARCHAR,
    p_metric_name VARCHAR,
    p_metric_value NUMERIC DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
    v_variant VARCHAR;
BEGIN
    -- Get user's variant
    SELECT variant INTO v_variant
    FROM experiment_assignments
    WHERE user_id = p_user_id 
        AND experiment_name = p_experiment_name
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP);
    
    IF v_variant IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Record metric
    INSERT INTO experiment_metrics (
        experiment_name, 
        user_id, 
        variant, 
        metric_name, 
        metric_value,
        metadata
    )
    VALUES (
        p_experiment_name,
        p_user_id,
        v_variant,
        p_metric_name,
        p_metric_value,
        p_metadata
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR A/B TEST ANALYSIS
-- ============================================================================

-- Experiment results by variant
CREATE OR REPLACE VIEW experiment_results AS
SELECT 
    em.experiment_name,
    e.description,
    em.variant,
    COUNT(DISTINCT em.user_id) as unique_users,
    COUNT(*) as total_events,
    COUNT(DISTINCT CASE WHEN em.metric_name = 'view' THEN em.user_id END) as views,
    COUNT(DISTINCT CASE WHEN em.metric_name = 'click' THEN em.user_id END) as clicks,
    COUNT(DISTINCT CASE WHEN em.metric_name = 'play' THEN em.user_id END) as plays,
    COUNT(DISTINCT CASE WHEN em.metric_name = 'subscribe' THEN em.user_id END) as subscribes,
    AVG(CASE WHEN em.metric_name = 'watch_time' THEN em.metric_value END) as avg_watch_time,
    COUNT(DISTINCT CASE WHEN em.metric_name = 'view' THEN em.user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT em.user_id), 0) * 100 as view_rate,
    COUNT(DISTINCT CASE WHEN em.metric_name = 'click' THEN em.user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT em.user_id), 0) * 100 as click_rate,
    COUNT(DISTINCT CASE WHEN em.metric_name = 'play' THEN em.user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT em.user_id), 0) * 100 as play_rate,
    COUNT(DISTINCT CASE WHEN em.metric_name = 'subscribe' THEN em.user_id END)::DECIMAL / 
        NULLIF(COUNT(DISTINCT em.user_id), 0) * 100 as conversion_rate
FROM experiment_metrics em
JOIN experiments e ON em.experiment_name = e.name
GROUP BY em.experiment_name, e.description, em.variant
ORDER BY em.experiment_name, em.variant;

-- Statistical significance (simplified)
CREATE OR REPLACE VIEW experiment_significance AS
WITH variant_stats AS (
    SELECT 
        experiment_name,
        variant,
        COUNT(DISTINCT user_id) as users,
        COUNT(DISTINCT CASE WHEN metric_name = 'play' THEN user_id END) as conversions,
        COUNT(DISTINCT CASE WHEN metric_name = 'play' THEN user_id END)::DECIMAL / 
            NULLIF(COUNT(DISTINCT user_id), 0) as conversion_rate
    FROM experiment_metrics
    GROUP BY experiment_name, variant
)
SELECT 
    experiment_name,
    MAX(CASE WHEN variant = 'control' THEN conversion_rate END) as control_rate,
    MAX(CASE WHEN variant = 'treatment' THEN conversion_rate END) as treatment_rate,
    MAX(CASE WHEN variant = 'treatment' THEN conversion_rate END) - 
        MAX(CASE WHEN variant = 'control' THEN conversion_rate END) as lift,
    (MAX(CASE WHEN variant = 'treatment' THEN conversion_rate END) - 
        MAX(CASE WHEN variant = 'control' THEN conversion_rate END)) /
        NULLIF(MAX(CASE WHEN variant = 'control' THEN conversion_rate END), 0) * 100 as lift_percentage
FROM variant_stats
GROUP BY experiment_name;

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

/*
-- 1. Create an experiment
INSERT INTO experiments (name, description, status, variants, start_date, end_date)
VALUES (
    'boosted_view_count',
    'Test impact of boosting visible view counts',
    'active',
    '["control", "treatment"]'::jsonb,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '30 days'
);

-- 2. Assign user to experiment
SELECT assign_to_experiment(
    'USER_UUID_HERE',
    'boosted_view_count',
    100  -- 100% traffic
);

-- 3. Record metrics
SELECT record_experiment_metric(
    'USER_UUID_HERE',
    'boosted_view_count',
    'view'
);

SELECT record_experiment_metric(
    'USER_UUID_HERE',
    'boosted_view_count',
    'play'
);

SELECT record_experiment_metric(
    'USER_UUID_HERE',
    'boosted_view_count',
    'subscribe'
);

-- 4. Analyze results
SELECT * FROM experiment_results WHERE experiment_name = 'boosted_view_count';

-- 5. Check significance
SELECT * FROM experiment_significance WHERE experiment_name = 'boosted_view_count';
*/

-- ============================================================================
-- TRIGGER TO UPDATE EXPERIMENT TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_experiment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER experiment_updated_at_trigger
    BEFORE UPDATE ON experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_experiment_timestamp();

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================

/*
DROP TRIGGER IF EXISTS experiment_updated_at_trigger ON experiments;
DROP FUNCTION IF EXISTS update_experiment_timestamp();
DROP VIEW IF EXISTS experiment_significance;
DROP VIEW IF EXISTS experiment_results;
DROP FUNCTION IF EXISTS record_experiment_metric;
DROP FUNCTION IF EXISTS assign_to_experiment;
DROP TABLE IF EXISTS experiment_metrics CASCADE;
DROP TABLE IF EXISTS experiment_assignments CASCADE;
DROP TABLE IF EXISTS experiments CASCADE;
*/

