-- Analytics Events Table
-- Tracks all user interactions with buttons and features

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event Information
  event_type TEXT NOT NULL, -- 'unlock_click', 'vip_service_click', 'modal_option1_click', 'modal_option2_click', 'cta_sidewalk_click'
  event_category TEXT, -- 'calendar', 'service', 'modal', 'cta'

  -- User Information
  user_id TEXT, -- Instagram username or audit ID
  session_id TEXT, -- Browser session identifier

  -- Location Information
  page_url TEXT, -- Full URL where click happened
  page_path TEXT, -- Path portion of URL (e.g., '/audit/abc123')
  component_location TEXT, -- Specific component (e.g., 'MosaicCalendar', 'ResultPage')

  -- Metadata
  user_agent TEXT, -- Browser information
  ip_address TEXT, -- User IP (optional, for analytics)
  referrer TEXT, -- Where user came from

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional Data (flexible JSON field)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_path ON analytics_events(page_path);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for now (you can restrict later)
CREATE POLICY "Enable all access for analytics_events" ON analytics_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE analytics_events IS 'Tracks user interactions and button clicks for analytics';
COMMENT ON COLUMN analytics_events.event_type IS 'Type of event (unlock_click, vip_service_click, etc.)';
COMMENT ON COLUMN analytics_events.user_id IS 'Instagram username or audit ID';
COMMENT ON COLUMN analytics_events.session_id IS 'Browser session identifier for tracking user journeys';
COMMENT ON COLUMN analytics_events.metadata IS 'Flexible JSON field for additional event data';
