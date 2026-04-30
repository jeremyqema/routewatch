# routewatch

Lightweight Express middleware for logging and alerting on slow API routes.

## Installation

```bash
npm install routewatch
```

## Usage

```typescript
import express from "express";
import { routewatch } from "routewatch";

const app = express();

// Log any route that takes longer than 500ms
app.use(
  routewatch({
    threshold: 500,
    onSlowRoute: (req, duration) => {
      console.warn(`Slow route detected: ${req.method} ${req.path} (${duration}ms)`);
    },
  })
);

app.get("/api/users", (req, res) => {
  res.json({ users: [] });
});

app.listen(3000);
```

### Options

| Option       | Type       | Default | Description                                      |
|--------------|------------|---------|--------------------------------------------------|
| `threshold`  | `number`   | `1000`  | Response time in ms before a route is flagged    |
| `onSlowRoute`| `function` | —       | Callback fired when a route exceeds the threshold |
| `logger`     | `function` | —       | Custom log function for all route timings        |

## License

MIT