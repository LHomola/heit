-- HEIT Housing Estate Issue Tracker

-- Enums

CREATE TYPE user_role AS ENUM (
    'resident',
    'manager',
    'contractor'
);

CREATE TYPE ticket_status AS ENUM (
    'open',
    'triaged',
    'assigned',
    'in_progress',
    'resolved',
    'closed'
);

CREATE TYPE sensor_type AS ENUM (
    'moisture',
    'smoke',
    'light',
    'temperature',
    'other'
);

-- Users

CREATE TABLE users (
    id              SERIAL          PRIMARY KEY,
    full_name       VARCHAR(120)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    hashed_password VARCHAR(255)    NOT NULL,
    role            user_role       NOT NULL,
    address         VARCHAR(200),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Categories

CREATE TABLE categories (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(80)     NOT NULL UNIQUE,
    description TEXT,
    created_by  INT             REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name, description) VALUES
    ('Plumbing',     'Water, pipes, drainage, leaks'),
    ('Electrical',   'Lighting, sockets, fuse board'),
    ('Structural',   'Walls, roof, foundations, windows'),
    ('Common Area',  'Shared gardens, car parks, apartment building hallways'),
    ('Pest Control', 'Rodents, insects'),
    ('Other',        'Anything else not covered above');

-- Tickets

CREATE TABLE tickets (
    id              SERIAL          PRIMARY KEY,
    title           VARCHAR(200)    NOT NULL,
    description     TEXT            NOT NULL,
    category_id     INT             NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    status          ticket_status   NOT NULL DEFAULT 'open',
    created_by      INT             NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    manager_id      INT             REFERENCES users(id) ON DELETE SET NULL,
    assigned_to     INT             REFERENCES users(id) ON DELETE SET NULL,
    is_public       BOOLEAN         NOT NULL DEFAULT FALSE,
    ai_suggestion   TEXT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_created_by  ON tickets(created_by);
CREATE INDEX idx_tickets_manager_id  ON tickets(manager_id);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_status      ON tickets(status);
CREATE INDEX idx_tickets_is_public   ON tickets(is_public);

-- Ticket status history

CREATE TABLE ticket_status_history (
    id          SERIAL          PRIMARY KEY,
    ticket_id   INT             NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    old_status  ticket_status,
    new_status  ticket_status   NOT NULL,
    changed_by  INT             REFERENCES users(id) ON DELETE SET NULL,
    note        TEXT,
    changed_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tsh_ticket_id ON ticket_status_history(ticket_id);

-- Ticket likes

CREATE TABLE ticket_likes (
    id          SERIAL          PRIMARY KEY,
    ticket_id   INT             NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id     INT             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_one_like_per_user UNIQUE (ticket_id, user_id)
);

-- Sensors

CREATE TABLE sensors (
    id              SERIAL          PRIMARY KEY,
    owner_id        INT             NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sensor_type     sensor_type     NOT NULL,
    location_desc   VARCHAR(200),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    registered_at   TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE sensor_events (
    id          SERIAL          PRIMARY KEY,
    sensor_id   INT             NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    payload     JSONB           NOT NULL,
    ticket_id   INT             REFERENCES tickets(id) ON DELETE SET NULL,
    received_at TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sensor_events_sensor_id ON sensor_events(sensor_id);
CREATE INDEX idx_sensor_events_ticket_id ON sensor_events(ticket_id);