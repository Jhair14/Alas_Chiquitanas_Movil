const assert = require('assert');
const { loginUser } = require('../utils/loginFlow');

describe('loginUser integration', function () {
  it('logs in with valid credentials', async function () {
    const result = await loginUser('1234567', 'mypassword');
    assert.strictEqual(result.token, 'mock-token-123');
  });

  it('fails with invalid credentials', async function () {
    try {
      await loginUser('1234567', 'wrongpass');
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.message, 'Invalid credentials');
    }
  });

  it('fails with invalid input', async function () {
    try {
      await loginUser('123', 'short');
      assert.fail('Should have thrown');
    } catch (err) {
      assert.strictEqual(err.message, 'Validation failed');
    }
  });
});