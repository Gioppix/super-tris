# Super Tris

Ultimate Tic-Tac-Toe (9x9 grid, 3x3 mega board). Real-time multiplayer with SSE.

Hosted at [tris.giovannifeltrin.com](https://tris.giovannifeltrin.com) (for now).

## Features

- Real-time multiplayer via Server-Sent Events
- Server-side rendering with SvelteKit
- Live game state synchronization
- Player presence detection
- Mouse position tracking (see opponent's cursor)
- In-game chat
- Rematch system

## Tech Stack

- SvelteKit (SSR + adapter-node)
- PostgreSQL
- better-auth for authentication
- Tailwind CSS
- Zod for validation

## Development

```sh
npm install
npm run dev
```

## Building

```sh
npm run build
npm start
```

## Game Rules

9x9 grid where each cell is a 3x3 mini board. Win 3 mini boards in a row to win the game.

Each move determines which mini board your opponent must play in next. If you play at position (x,y) in a mini board, your opponent plays in mini board (x,y). If sent to a completed board, choose any available mini board.

### Next Steps

- Database design is currently trash: my idea was to keep everything in RAM since that wasn't the goal of this project, but it was a bit annoying to I spun up a simple PG instance.
- Move everything to Web Sockets: faster / more efficient than HTTP calls, would make SSE redundant (I wanted to experiment with that technique)
- Add ELO, leaderboards, tests...
