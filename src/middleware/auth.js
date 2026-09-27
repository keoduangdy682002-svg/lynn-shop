// ຟັງຊັນຊ່ວຍ "ຝາກ" ຂໍ້ຄວາມແຈ້ງເຕືອນໄວ້ໃນ session ກ່ອນ redirect
function setFlash(req, type, message) {
  req.session.flash = { type, message }; // type: 'success' | 'error'
}

// ຕິດ user + flash message ໃສ່ res.locals ໃຫ້ທຸກ view ໃຊ້ໄດ້
function attachUser(req, res, next) {
  res.locals.user = req.session.user || null;
  res.locals.cartCount = req.session.cartCount || 0;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
}

// ບັງຄັບໃຫ້ login ກ່ອນ
// ຮອງຮັບ AJAX request (ເຊັ່ນ ກົດເພີ່ມໃສ່ກະຕ່າ) — ຕອບ JSON ແທນ redirect
// ໃຫ້ໜ້າເວັບສະແດງ popup ແລ້ວເດັ້ງໄປໜ້າສະໝັກສະມາຊິກໄດ້ເອງ
function requireAuth(req, res, next) {
  if (!req.session.user) {
    const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest';
    if (isAjax) {
      return res.status(401).json({
        success: false,
        requiresAuth: true,
        message: 'ກະລຸນາສະໝັກສະມາຊິກ ຫລື ເຂົ້າສູ່ລະບົບກ່ອນ ຈຶ່ງຈະສາມາດເພີ່ມສິນຄ້າໃສ່ກະຕ່າໄດ້'
      });
    }
    req.session.redirectTo = req.originalUrl;
    setFlash(req, 'error', 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ');
    return res.redirect('/auth/login');
  }
  next();
}

// ບັງຄັບ role = admin
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('error', { message: 'ທ່ານບໍ່ມີສິດເຂົ້າໜ້ານີ້ (Admin only)' });
  }
  next();
}

module.exports = { attachUser, requireAuth, requireAdmin, setFlash };
