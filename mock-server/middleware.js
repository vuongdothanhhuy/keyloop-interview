// mock-server/middleware.js
// Simulates realistic network conditions so the frontend's loading/error/retry
// paths have something real to exercise against, instead of instant mock responses.
const MIN_DELAY_MS = 150;
const MAX_DELAY_MS = 500;
// ~3% of GETs return a transient 503 by default. Playwright's webServer (Task 20) sets
// ERROR_RATE=0 so injected 503s don't flake the e2e suite — the store's error-handling path
// is already covered deterministically by VehicleStore's unit tests (Task 12).
const ERROR_RATE = process.env['ERROR_RATE'] !== undefined ? Number(process.env['ERROR_RATE']) : 0.03;

module.exports = (req, res, next) => {
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  setTimeout(() => {
    if (req.method === 'GET' && Math.random() < ERROR_RATE) {
      res.status(503).json({ error: 'Service temporarily unavailable' });
      return;
    }
    next();
  }, delay);
};
