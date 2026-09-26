const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const supabaseAuth = supabase.authClient;
const { setFlash } = require('../middleware/auth');

// ---- ໜ້າ Register ----
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'ສະໝັກສະມາຊິກ', error: null });
});

router.post('/register', async (req, res) => {
  const { full_name, email, password, phone } = req.body;
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });
    if (error) throw error;

    if (phone) {
      await supabase.from('profiles').update({ phone }).eq('id', data.user.id);
    }

    req.session.user = { id: data.user.id, email, full_name, role: 'customer' };
    setFlash(req, 'success', `ສະໝັກສະມາຊິກສຳເລັດ! ຍິນດີຕ້ອນຮັບ ${full_name || ''} 🌿`);
    res.redirect('/');
  } catch (err) {
    res.render('auth/register', {
      title: 'ສະໝັກສະມາຊິກ',
      error: err.message || 'ສະໝັກສະມາຊິກລົ້ມເຫລວ ກະລຸນາລອງໃໝ່'
    });
  }
});

// ---- ໜ້າ Login ----
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'ເຂົ້າສູ່ລະບົບ', error: null });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    req.session.user = {
      id: data.user.id,
      email: data.user.email,
      full_name: profile?.full_name || '',
      role: profile?.role || 'customer'
    };

    // ຄິດໄລ່ຈຳນວນສິນຄ້າໃນກະຕ່າ ໃຫ້ badge ຖືກຕ້ອງທັນທີຫລັງ login
    const { data: cart } = await supabase.from('carts').select('*').eq('user_id', data.user.id).single();
    if (cart) {
      const { data: items } = await supabase.from('cart_items').select('quantity').eq('cart_id', cart.id);
      req.session.cartCount = (items || []).reduce((sum, i) => sum + i.quantity, 0);
    }

    const redirectTo = req.session.redirectTo || '/';
    delete req.session.redirectTo;
    setFlash(req, 'success', `ເຂົ້າສູ່ລະບົບສຳເລັດ! ຍິນດີຕ້ອນຮັບກັບຄືນ 🌿`);
    res.redirect(redirectTo);
  } catch (err) {
    res.render('auth/login', {
      title: 'ເຂົ້າສູ່ລະບົບ',
      error: 'ອີເມວ ຫລື ລະຫັດຜ່ານ ບໍ່ຖືກຕ້ອງ'
    });
  }
});

// ---- Logout ----
router.post('/logout', (req, res) => {
  delete req.session.user;
  delete req.session.cartCount;
  setFlash(req, 'success', 'ອອກຈາກລະບົບແລ້ວ ພົບກັນໃໝ່ 🌿');
  res.redirect('/');
});

module.exports = router;
