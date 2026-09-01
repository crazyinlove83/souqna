const jwt = require('jsonwebtoken');
function authenticate(req, res, next) { const token = req.headers.authorization?.replace(/^Bearer\s+/i, ''); if (!token) return res.status(401).json({ error: 'Authentication required' }); try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); } catch { res.status(401).json({ error: 'Invalid or expired session' }); } }
const allow = (...roles) => (req,res,next) => roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Insufficient permissions' });
module.exports = { authenticate, allow };
