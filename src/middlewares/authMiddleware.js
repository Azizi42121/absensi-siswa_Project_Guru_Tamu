// Middleware for Authentication & Role-Based Access Control (RBAC)

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/auth/login');
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/auth/login');
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).render('error/403', {
        title: '403 Forbidden - Akses Ditolak',
        user: req.session.user,
        message: `Role Anda (${req.session.user.role}) tidak memiliki izin untuk mengakes halaman ini.`
      });
    }

    next();
  };
}

module.exports = {
  isAuthenticated,
  authorizeRoles,
};
