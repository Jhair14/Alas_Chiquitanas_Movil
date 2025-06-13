
function isValidLogin(ci, password) {
  return /^\d{6,}$/.test(ci) && typeof password === 'string' && password.length >= 6;
}
module.exports = { isValidLogin };