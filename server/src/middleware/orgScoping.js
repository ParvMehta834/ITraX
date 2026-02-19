/**
 * Organization Scoping Middleware
 * Ensures all queries are scoped to the user's organization
 * Must be used after authMiddleware
 */

const orgScopingMiddleware = (req, res, next) => {
  if (!req.user || !req.user.orgId) {
    return res.status(403).json({
      message: 'Organization not found on user profile',
    });
  }

  // Attach orgId to request for use in route handlers
  req.orgId = req.user.orgId;

  next();
};

module.exports = { orgScopingMiddleware };
