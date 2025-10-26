CREATE TABLE game
(
    game_id               serial                    NOT NULL PRIMARY KEY,
    name                  text,
    player1_id            text                      NOT NULL REFERENCES "user" (id),
    player2_id            text REFERENCES "user" (id),
    first_rematch_sent_by text REFERENCES "user" (id),
    rematch_game_id       integer REFERENCES game (game_id),
    created_at            timestamptz DEFAULT NOW() NOT NULL
);

CREATE TABLE move
(
    move_id    serial PRIMARY KEY,
    game_id    integer                   NOT NULL REFERENCES game (game_id),
    x          integer                   NOT NULL CHECK (x >= 0 AND x <= 8),
    y          integer                   NOT NULL CHECK (y >= 0 AND y <= 8),
    created_at timestamptz DEFAULT NOW() NOT NULL,
    UNIQUE (game_id, x, y)
);

CREATE TABLE message
(
    message_id serial PRIMARY KEY,
    game_id    integer                   NOT NULL REFERENCES game (game_id),
    user_id    text                      NOT NULL REFERENCES "user" (id),
    content    text                      NOT NULL CHECK (LENGTH(content) < 500),
    timestamp  timestamptz DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_move_game_id ON move (game_id);
CREATE INDEX idx_message_game_id ON message (game_id);
CREATE INDEX idx_message_timestamp ON message (timestamp);
