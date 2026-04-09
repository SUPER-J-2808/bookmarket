/** Simple format check — allows normal addresses (e.g. Gmail) for easy local testing */
const isCollegeEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

module.exports = { isCollegeEmail };
