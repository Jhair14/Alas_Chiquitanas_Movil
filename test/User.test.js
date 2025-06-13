const assert = require('assert');
const { isValidLogin } = require('../utils/authUtils');

describe('isValidLogin', function () {
  it('returns true for valid CI and password', function () {
    assert.strictEqual(isValidLogin('1234567', 'mypassword'), true);
  });
  it('returns false for short CI', function () {
    assert.strictEqual(isValidLogin('12345', 'mypassword'), false);
  });
  it('returns false for short password', function () {
    assert.strictEqual(isValidLogin('1234567', '123'), false);
  });
  it('returns false for non-numeric CI', function () {
    assert.strictEqual(isValidLogin('abc123', 'mypassword'), false);
  });
});