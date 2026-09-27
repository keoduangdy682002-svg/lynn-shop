const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const supabaseAuth = supabase.authClient;
const { setFlash } = require('../middleware/auth');

// ---- ຊ່ວຍປ່ຽນ "ເບີໂທ" ໃຫ້ກາຍເປັນ email ປອມ ເພື່ອໃຊ້ກັບ Supabase Auth ----
// (Supabase Auth ຕ້ອງການ email ຫລື ເບີໂທ+SMS OTP; ໂປເຈັກນີ້ບໍ່ໄດ້ຕໍ່ SMS gateway
//  ຈຶ່ງໃຊ້ email ປອມແທນເບື້ອງຫລັງ ເພື່ອໃຫ້ລູກຄ້າ "ຮູ້ສຶກ" ວ່າສະໝັກດ້ວຍເບີໂທໄດ້ຈິງ)
function identifierToEmail(identifier) {
  const trimmed = (identifier || '').trim();
  if (trimmed.includes('@')) return trimmed.toLowerCase();
  const digits = trimmed.replace(/\D/g, '');
  return `${digits}@phone.lynnshop.local`;
}

function isPhoneLike(identifier) {
  return !!identifier && !identifier.includes('@');
}

async function setSessionAfterAuth(req, userId, fallbackEmail) {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  req.session.user = {
    id: userId,
    email: profile?.email || fallbackEmail,
    full_name: profile?.full_name || '',
    role: profile?.role || 'customer'
  };
  const { data: cart } = await supabase.from('carts').select('*').eq('user_id', userId).maybeSingle();
  if (cart) {
    const { data: items } = await supabase.from('cart_items').select('quantity').eq('cart_id', cart.id);
    req.session.cartCount = (items || []).reduce((sum, i) => sum + i.quantity, 0);
  }
}

// ---- ໜ້າ Register ----
router.get('/register', (req, res) => {
  res.render('auth/register', { title: 'ສະໝັກສະມາຊິກ', error: null });
});

router.post('/register', async (req, res) => {
  const { full_name, identifier, password, phone } = req.body;
  try {
    const authEmail = identifierToEmail(identifier);
    const usedPhone = isPhoneLike(identifier) ? identifier.replace(/\D/g, '') : (phone || null);

    const { data, error } = await supabase.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name }
    });
    if (error) throw error;

    await supabase.from('profiles').update({
      phone: usedPhone,
      email: isPhoneLike(identifier) ? null : identifier
    }).eq('id', data.user.id);

    req.session.user = { id: data.user.id, email: identifier, full_name, role: 'customer' };
    setFlash(req, 'success', `ສະໝັກສະມາຊິກສຳເລັດ! ຍິນດີຕ້ອນຮັບ ${full_name || ''} 🌿`);
    res.redirect('/');
  } catch (err) {
    const msg = err.message?.includes('already been registered') || err.message?.includes('already registered')
      ? 'ອີເມວ/ເບີໂທນີ້ຖືກໃຊ້ສະໝັກແລ້ວ'
      : (err.message || 'ສະໝັກສະມາຊິກລົ້ມເຫລວ ກະລຸນາລອງໃໝ່');
    res.render('auth/register', { title: 'ສະໝັກສະມາຊິກ', error: msg });
  }
});

// ---- ໜ້າ Login ----
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'ເຂົ້າສູ່ລະບົບ', error: null });
});

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const authEmail = identifierToEmail(identifier);
    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email: authEmail, password });
    if (error) throw error;

    await setSessionAfterAuth(req, data.user.id, identifier);

    const redirectTo = req.session.redirectTo || '/';
    delete req.session.redirectTo;
    setFlash(req, 'success', 'ເຂົ້າສູ່ລະບົບສຳເລັດ! ຍິນດີຕ້ອນຮັບກັບຄືນ 🌿');
    res.redirect(redirectTo);
  } catch (err) {
    res.render('auth/login', { title: 'ເຂົ້າສູ່ລະບົບ', error: 'ອີເມວ/ເບີໂທ ຫລື ລະຫັດຜ່ານ ບໍ່ຖືກຕ້ອງ' });
  }
});

// ---- Logout ----
router.post('/logout', (req, res) => {
  delete req.session.user;
  delete req.session.cartCount;
  setFlash(req, 'success', 'ອອກຈາກລະບົບແລ້ວ ພົບກັນໃໝ່ 🌿');
  res.redirect('/');
});

// =====================================================================
// Social Login (Google / Facebook) ຜ່ານ Supabase OAuth
// ໜ້ານີ້ໃຊ້ supabase-js ຝັ່ງ browser (ດ້ວຍ anon key, ປອດໄພທີ່ຈະເປີດເຜີຍ)
// ເພື່ອເຮັດການ redirect ໄປຫາ Google/Facebook ແລ້ວກັບຄືນມາທີ່ນີ້
// =====================================================================
router.get('/social-callback', (req, res) => {
  res.render('auth/social-callback', {
    title: 'ກຳລັງເຂົ້າສູ່ລະບົບ...',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY
  });
});

// ຫລັງຈາກ browser ຢືນຢັນຕົວຕົນກັບ Google/Facebook ສຳເລັດແລ້ວ,
// ໜ້າ social-callback ຈະສົ່ງ access_token ມາທີ່ນີ້ໃຫ້ server ຕັ້ງ session ໃຫ້
router.post('/social-session', async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ success: false, message: 'ບໍ່ພົບ token' });

    const { data: userData, error } = await supabaseAuth.auth.getUser(access_token);
    if (error || !userData?.user) throw error || new Error('token ບໍ່ຖືກຕ້ອງ');

    const user = userData.user;

    // ຖ້າຍັງບໍ່ມີ profile (login ຄັ້ງທຳອິດຜ່ານ social) ໃຫ້ສ້າງໃຫ້
    const { data: existingProfile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (!existingProfile) {
      await supabase.from('profiles').insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        email: user.email
      });
    }

    await setSessionAfterAuth(req, user.id, user.email);
    setFlash(req, 'success', 'ເຂົ້າສູ່ລະບົບສຳເລັດ! ຍິນດີຕ້ອນຮັບ 🌿');
    res.json({ success: true, redirect: '/' });
  } catch (err) {
    console.error('social-session error:', err.message);
    res.status(400).json({ success: false, message: 'ເຂົ້າສູ່ລະບົບດ້ວຍ social ບໍ່ສຳເລັດ' });
  }
});

module.exports = router;
