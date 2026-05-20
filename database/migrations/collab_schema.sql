-- ============================================================
-- GenoNexus Collaboration Schema
-- Run once: psql $DATABASE_URL -f collab_schema.sql
-- ============================================================

-- ── Hypotheses ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hypotheses (
  id           TEXT        PRIMARY KEY,          -- e.g. "H-405"
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  tags         JSONB       NOT NULL DEFAULT '[]',
  annotations  JSONB       NOT NULL DEFAULT '[]',
  confidence   INTEGER     NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 0 AND 100),
  version      INTEGER     NOT NULL DEFAULT 1,
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  comments     INTEGER     NOT NULL DEFAULT 0,
  avatars      JSONB       NOT NULL DEFAULT '[]',
  chat_messages JSONB      NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hypotheses_user_idx ON hypotheses(user_id);
CREATE INDEX IF NOT EXISTS hypotheses_active_idx ON hypotheses(active);

-- ── Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS hypotheses_updated_at ON hypotheses;
CREATE TRIGGER hypotheses_updated_at
  BEFORE UPDATE ON hypotheses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Collaboration Alerts ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS collab_alerts (
  id         SERIAL      PRIMARY KEY,
  user_id    UUID        REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL DEFAULT 'info' CHECK (type IN ('critical','warning','info')),
  title      TEXT        NOT NULL,
  desc_text  TEXT,
  gene       TEXT,
  action     TEXT,
  region     TEXT,
  dismissed  BOOLEAN     NOT NULL DEFAULT FALSE,
  auto_gen   BOOLEAN     NOT NULL DEFAULT FALSE, -- TRUE = system generated from variant data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS collab_alerts_user_idx      ON collab_alerts(user_id);
CREATE INDEX IF NOT EXISTS collab_alerts_dismissed_idx ON collab_alerts(dismissed);

-- ── Pipeline Runs ─────────────────────────────────────────────
-- Links genomic analysis jobs to the collaboration pipeline view
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id             TEXT        PRIMARY KEY,
  user_id        UUID        REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'queued'
                             CHECK (status IN ('running','completed','failed','paused','queued')),
  progress       INTEGER     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  eta            TEXT,
  stages         JSONB       NOT NULL DEFAULT '[]',
  logs           JSONB       NOT NULL DEFAULT '[]',
  comparison_id  UUID        REFERENCES comparison_results(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pipeline_runs_user_idx ON pipeline_runs(user_id);
CREATE INDEX IF NOT EXISTS pipeline_runs_status_idx ON pipeline_runs(status);

DROP TRIGGER IF EXISTS pipeline_runs_updated_at ON pipeline_runs;
CREATE TRIGGER pipeline_runs_updated_at
  BEFORE UPDATE ON pipeline_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Hypothesis Chat Messages ──────────────────────────────────
CREATE TABLE IF NOT EXISTS hypothesis_messages (
  id            SERIAL      PRIMARY KEY,
  hypothesis_id TEXT        REFERENCES hypotheses(id) ON DELETE CASCADE,
  author        TEXT        NOT NULL,
  text          TEXT        NOT NULL,
  is_ai         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hypo_messages_hypo_idx ON hypothesis_messages(hypothesis_id);
