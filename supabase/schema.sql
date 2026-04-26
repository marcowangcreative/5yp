-- =====================================================================
-- Five Year Plan Dashboard — Database Schema
-- Run this in Supabase SQL Editor after creating your project
-- =====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================================
-- TABLES
-- =====================================================================

-- Allowed users (only these emails can sign in)
CREATE TABLE allowed_users (
  email TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Businesses (Marco Wang Co. and Flowe)
CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  color_theme TEXT DEFAULT 'stone',
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income streams (Photography, Photobox, Wefts, etc.)
CREATE TABLE income_streams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Annual income targets per stream
CREATE TABLE income_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES income_streams(id) ON DELETE CASCADE,
  year INT NOT NULL,
  target_amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (stream_id, year)
);

-- Monthly actual income entries
CREATE TABLE income_actuals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stream_id UUID REFERENCES income_streams(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  entered_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (stream_id, year, month)
);

-- Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id TEXT REFERENCES businesses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  phase TEXT,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'done', 'blocked')),
  due_date DATE,
  notes TEXT,
  display_order INT DEFAULT 0,
  target_year INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sub-tasks
CREATE TABLE milestone_subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Strategic notes (journal-like, per quarter)
CREATE TABLE strategic_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INT NOT NULL,
  quarter INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  business_id TEXT REFERENCES businesses(id) ON DELETE SET NULL,
  title TEXT,
  content TEXT NOT NULL,
  authored_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- INDEXES
-- =====================================================================

CREATE INDEX idx_income_streams_business ON income_streams(business_id);
CREATE INDEX idx_income_targets_year ON income_targets(year);
CREATE INDEX idx_income_actuals_year_month ON income_actuals(year, month);
CREATE INDEX idx_income_actuals_stream ON income_actuals(stream_id);
CREATE INDEX idx_milestones_business ON milestones(business_id);
CREATE INDEX idx_milestones_status ON milestones(status);
CREATE INDEX idx_subtasks_milestone ON milestone_subtasks(milestone_id);

-- =====================================================================
-- TRIGGERS — auto-update updated_at
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_income_targets_updated_at BEFORE UPDATE ON income_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_actuals_updated_at BEFORE UPDATE ON income_actuals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- ROW LEVEL SECURITY
-- All authenticated users in allowed_users get full access
-- =====================================================================

ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategic_notes ENABLE ROW LEVEL SECURITY;

-- Helper function: is the current user in allowed_users?
CREATE OR REPLACE FUNCTION is_allowed_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM allowed_users
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allowed users table: only allowed users can read it
CREATE POLICY "allowed_users_read" ON allowed_users FOR SELECT USING (is_allowed_user());

-- Everything else: allowed users have full access
CREATE POLICY "businesses_all" ON businesses FOR ALL USING (is_allowed_user()) WITH CHECK (is_allowed_user());
CREATE POLICY "income_streams_all" ON income_streams FOR ALL USING (is_allowed_user()) WITH CHECK (is_allowed_user());
CREATE POLICY "income_targets_all" ON income_targets FOR ALL USING (is_allowed_user()) WITH CHECK (is_allowed_user());
CREATE POLICY "income_actuals_all" ON income_actuals FOR ALL USING (is_allowed_user()) WITH CHECK (is_allowed_user());
CREATE POLICY "milestones_all" ON milestones FOR ALL USING (is_allowed_user()) WITH CHECK (is_allowed_user());
CREATE POLICY "subtasks_all" ON milestone_subtasks FOR ALL USING (is_allowed_user()) WITH CHECK (is_allowed_user());
CREATE POLICY "strategic_notes_all" ON strategic_notes FOR ALL USING (is_allowed_user()) WITH CHECK (is_allowed_user());

-- =====================================================================
-- SEED DATA
-- =====================================================================

-- Allowed users — UPDATE THESE EMAILS BEFORE RUNNING
INSERT INTO allowed_users (email, display_name) VALUES
  ('marco@example.com', 'Marco'),
  ('jordan@example.com', 'Jordan')
ON CONFLICT (email) DO NOTHING;

-- Businesses
INSERT INTO businesses (id, name, subtitle, color_theme, display_order) VALUES
  ('marco', 'Marco Wang Co.', 'Photography + Photobox', 'stone', 1),
  ('flowe', 'Flowe', 'Wefts → Salon → Booth', 'rose', 2);

-- Income streams
INSERT INTO income_streams (business_id, name, description, display_order) VALUES
  ('marco', 'Photography (flagship)', 'Marco Wang digital flagship weddings', 1),
  ('marco', 'Photography (film flagship)', 'Marco Wang Film co-shot with senior associate', 2),
  ('marco', 'Photography (associates)', 'Marco Wang Studio Associates tier', 3),
  ('marco', 'Photobox subscriptions', 'Photographer monthly subs', 4),
  ('marco', 'Photobox transactions', 'Box order revenue (your cut after photographer split)', 5),
  ('flowe', 'Butterfly wefts', 'Pro stylist wholesale', 1),
  ('flowe', 'Salon services', 'Jordan + team chair work', 2),
  ('flowe', 'Booth rental', '3 chairs at $600/week', 3);

-- 5-year income targets (in dollars, NET to household)
-- Marco
INSERT INTO income_targets (stream_id, year, target_amount, notes)
SELECT id, year, amount, note FROM (
  VALUES
    ('Photography (flagship)', 2026, 175000, 'Year 1: stable at current'),
    ('Photography (flagship)', 2027, 200000, 'Y2: associate model maturing'),
    ('Photography (flagship)', 2028, 220000, 'Y3: peak'),
    ('Photography (flagship)', 2029, 200000, 'Y4: scaling back personal weddings'),
    ('Photography (flagship)', 2030, 150000, 'Y5: semi-retirement transition'),
    ('Photography (film flagship)', 2026, 40000, 'Y1: 4-6 weddings, ramp'),
    ('Photography (film flagship)', 2027, 100000, 'Y2: full year'),
    ('Photography (film flagship)', 2028, 130000, 'Y3'),
    ('Photography (film flagship)', 2029, 130000, 'Y4'),
    ('Photography (film flagship)', 2030, 100000, 'Y5'),
    ('Photography (associates)', 2026, 25000, 'Y1: junior tier launch'),
    ('Photography (associates)', 2027, 60000, 'Y2'),
    ('Photography (associates)', 2028, 90000, 'Y3'),
    ('Photography (associates)', 2029, 110000, 'Y4'),
    ('Photography (associates)', 2030, 130000, 'Y5'),
    ('Photobox subscriptions', 2026, 5000, 'Y1: small beta'),
    ('Photobox subscriptions', 2027, 25000, 'Y2'),
    ('Photobox subscriptions', 2028, 60000, 'Y3'),
    ('Photobox subscriptions', 2029, 100000, 'Y4'),
    ('Photobox subscriptions', 2030, 150000, 'Y5'),
    ('Photobox transactions', 2026, 30000, 'Y1: first paid orders'),
    ('Photobox transactions', 2027, 100000, 'Y2'),
    ('Photobox transactions', 2028, 220000, 'Y3'),
    ('Photobox transactions', 2029, 350000, 'Y4'),
    ('Photobox transactions', 2030, 500000, 'Y5')
) AS t(stream_name, year, amount, note)
JOIN income_streams s ON s.name = t.stream_name AND s.business_id = 'marco';

-- Flowe
INSERT INTO income_targets (stream_id, year, target_amount, notes)
SELECT id, year, amount, note FROM (
  VALUES
    ('Butterfly wefts', 2026, 30000, 'Y1: 5-10 stylists, ramp'),
    ('Butterfly wefts', 2027, 80000, 'Y2'),
    ('Butterfly wefts', 2028, 150000, 'Y3: v2 launch'),
    ('Butterfly wefts', 2029, 220000, 'Y4'),
    ('Butterfly wefts', 2030, 300000, 'Y5'),
    ('Salon services', 2026, 180000, 'Y1: current state, restructuring'),
    ('Salon services', 2027, 240000, 'Y2: higher-value mix'),
    ('Salon services', 2028, 280000, 'Y3'),
    ('Salon services', 2029, 280000, 'Y4: stable'),
    ('Salon services', 2030, 250000, 'Y5: Jordan scaling back'),
    ('Booth rental', 2026, 90000, '3 chairs × $600/wk'),
    ('Booth rental', 2027, 95000, 'Y2'),
    ('Booth rental', 2028, 120000, 'Y3: possibly 4th chair'),
    ('Booth rental', 2029, 120000, 'Y4'),
    ('Booth rental', 2030, 120000, 'Y5')
) AS t(stream_name, year, amount, note)
JOIN income_streams s ON s.name = t.stream_name AND s.business_id = 'flowe';

-- Milestones (Marco)
INSERT INTO milestones (business_id, title, phase, status, due_date, notes, display_order, target_year) VALUES
  ('marco', 'Senior associate film flagship', 'Months 1-2', 'not_started', '2026-06-15', 'Co-launch premium film line at $25-35k. He''s already convinced — formalize splits in writing.', 1, 2026),
  ('marco', 'Junior associate tier launch', 'Months 1-3', 'not_started', '2026-07-01', 'Marco Wang Studio Associates at $5-10k. OTJ training as he interns.', 2, 2026),
  ('marco', 'Inquiry routing system', 'Months 1-2', 'not_started', '2026-06-01', 'CRM already built — add tier branching for $15k+/film/sub-$10k routing.', 3, 2026),
  ('marco', 'Photobox: Fix demo gallery', 'Week 1', 'not_started', '2026-05-02', '/g/demo currently 404s. Fix before sending to beta photographers.', 4, 2026),
  ('marco', 'Photobox: Three photographer demos', 'Weeks 1-2', 'not_started', '2026-05-09', 'Frame as favor request, not pitch. "Tell me what''s wrong."', 5, 2026),
  ('marco', 'Photobox: Supply chain validation', 'Weeks 1-2', 'not_started', '2026-05-09', 'Local lab confirmed. Vendor conversation with engraver friend needed.', 6, 2026),
  ('marco', 'Photobox: Stripe Connect + commerce', 'Months 2-3', 'not_started', '2026-07-15', '40-65 hours of work. Stripe Connect Express, photographer onboarding, base + markup pricing.', 7, 2026),
  ('marco', 'Photobox: First paid box shipped', 'Months 4-6', 'not_started', '2026-09-30', 'First real revenue milestone. Validates entire end-to-end flow.', 8, 2026),
  ('marco', 'Photography Y1 success criteria', 'Month 12', 'not_started', '2027-04-01', 'Senior assoc 2+ film weddings, junior 4+, gross up $80k+, hours flat or down.', 9, 2026);

-- Milestones (Flowe)
INSERT INTO milestones (business_id, title, phase, status, due_date, notes, display_order, target_year) VALUES
  ('flowe', 'Butterfly wefts: Initial PO', 'Months 1-2', 'not_started', '2026-06-15', '4-6 SKUs, 100-150 units. ~$15-20k cash outlay.', 1, 2026),
  ('flowe', 'Wefts: Shopify B2B + Pro pricing', 'Months 1-2', 'not_started', '2026-06-30', 'Pro account verification, 15-18% pro discount structure.', 2, 2026),
  ('flowe', 'Wefts: 20 stylist outreach', 'Months 2-4', 'not_started', '2026-07-15', 'Jordan personally calls 20 stylists from existing network. Send samples to top 8-12.', 3, 2026),
  ('flowe', 'Wefts: First reorder cycle', 'Months 4-6', 'not_started', '2026-10-01', 'Track which stylists reorder vs one-time. Reorder rate = leading indicator.', 4, 2026),
  ('flowe', 'Brand: Flowe identity locked', 'Months 1-3', 'not_started', '2026-07-15', 'Logo, palette, typography, voice that carries across wefts → salon → booth rental.', 5, 2026),
  ('flowe', 'Salon: Higher-value service marketing', 'Ongoing', 'not_started', '2026-12-31', 'Ensure Jordan can fill recovered chair time with $300+ services.', 6, 2026),
  ('flowe', 'Booth rental: Stable operation', 'Ongoing', 'in_progress', '2026-12-31', '$600/week × 3 stylists currently. Stable revenue, low effort.', 7, 2026),
  ('flowe', 'Wefts v2: Custom PU innovation', 'Months 12-18', 'not_started', '2027-10-01', 'Real product differentiation. Engineer with factory partner.', 8, 2027);

-- Sub-tasks for first few milestones (full set in subsequent migration)
INSERT INTO milestone_subtasks (milestone_id, title, display_order)
SELECT id, t.title, t.ord FROM milestones, (VALUES
  ('Senior associate film flagship', 'Formalize 50/50 split agreement in writing', 1),
  ('Senior associate film flagship', 'Define film flagship package (deliverables, turnaround)', 2),
  ('Senior associate film flagship', 'Build Marco Wang Film offer page', 3),
  ('Senior associate film flagship', 'First booking target', 4),
  ('Junior associate tier launch', 'Define junior tier package and pricing', 1),
  ('Junior associate tier launch', 'Build Studio Associates landing page section', 2),
  ('Junior associate tier launch', 'First sub-$10k inquiry routed to junior', 3),
  ('Junior associate tier launch', 'Quality check protocol on first 5 weddings', 4),
  ('Photobox: Fix demo gallery', 'Debug 404 on demo route', 1),
  ('Photobox: Fix demo gallery', 'Seed demo gallery with hero images', 2),
  ('Photobox: Fix demo gallery', 'Test on mobile + desktop', 3),
  ('Photobox: Three photographer demos', 'Send outreach messages to 3 photographers', 1),
  ('Photobox: Three photographer demos', 'Schedule 30-min demo calls', 2),
  ('Photobox: Three photographer demos', 'Conduct demos and capture feedback', 3),
  ('Photobox: Three photographer demos', 'Decision: greenlight, refine, or pivot', 4),
  ('Photobox: Supply chain validation', 'Vendor conversation with engraver friend (terms in writing)', 1),
  ('Photobox: Supply chain validation', 'Order print sample from local lab', 2),
  ('Photobox: Supply chain validation', 'Contact 2 box vendors with 4x6 window-top spec', 3),
  ('Photobox: Supply chain validation', 'Confirm per-box COGS at small batch', 4),
  ('Butterfly wefts: Initial PO', 'Finalize launch SKU list (16/18/20 base + 20 prem)', 1),
  ('Butterfly wefts: Initial PO', 'Confirm factory FOB pricing for initial run', 2),
  ('Butterfly wefts: Initial PO', 'Place initial PO', 3),
  ('Butterfly wefts: Initial PO', 'Inventory arrival and intake', 4),
  ('Wefts: 20 stylist outreach', 'Inventory stylist network (full list with notes)', 1),
  ('Wefts: 20 stylist outreach', 'Initial outreach to top 20', 2),
  ('Wefts: 20 stylist outreach', 'Send samples to 8-12 most likely converters', 3),
  ('Wefts: 20 stylist outreach', 'Convert 5-10 to first orders', 4)
) AS t(milestone_title, title, ord)
WHERE milestones.title = t.milestone_title;
