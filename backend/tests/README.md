# TMIS Test Commands

## Quick Start

Run these commands to verify your TMIS backend:

```bash
# Test 1: Real HTTP endpoints (60s)
node tests/real-endpoint-tests.js

# Test 2: All 83 controller methods (30s)
node tests/reliable-test.js

# Test 3: Both together (90s)
node tests/test-all.js
```

## Expected Results

- Real Endpoint Tests: 10/10 (100%)
- Reliable Endpoint Tests: 83/83 (100%)

## Troubleshooting

**Module not found error?**
- Run from backend root directory
- Use: `node tests/reliable-test.js` (not `node reliable-test.js`)

**Database errors?**
- Ensure MySQL is running
- Check `tmis_test` database exists
- Verify credentials in `tests/.env.test`

## Success

Your TMIS backend is production-ready when both tests show 100%!
