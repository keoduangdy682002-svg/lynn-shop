const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { requireAuth, setFlash } = require('../middleware/auth');

// ຊອກຫາ (ຫລືສ້າງ) cart ຂອງ user ໃນ DB
async function getOrCreateCart(userId) {
  let { data: cart } = await supabase.from('carts').select('*').eq('user_id', userId).single();
  if (!cart) {
    const { data } = await supabase.from('carts').insert({ user_id: userId }).select().single();
    cart = data;
  }
  return cart;
}

// ນັບຈຳນວນສິນຄ້າທັງໝົດໃນກະຕ່າ (ລວມ quantity ທຸກລາຍການ) — ໃຊ້ສະແດງ badge
async function countCartItems(cartId) {
  const { data } = await supabase.from('cart_items').select('quantity').eq('cart_id', cartId);
  return (data || []).reduce((sum, i) => sum + i.quantity, 0);
}

router.use(requireAuth);

// ---- ເບິ່ງກະຕ່າ ----
router.get('/', async (req, res) => {
  const cart = await getOrCreateCart(req.session.user.id);
  const { data: items } = await supabase
    .from('cart_items')
    .select('*, products(*, product_images(*)), product_variants(*)')
    .eq('cart_id', cart.id);

  const total = (items || []).reduce((sum, i) => {
    const price = Number(i.products.price) + Number(i.product_variants?.extra_price || 0);
    return sum + price * i.quantity;
  }, 0);

  req.session.cartCount = await countCartItems(cart.id);
  res.render('cart', { title: 'ກະຕ່າສິນຄ້າ', items: items || [], total });
});

// ---- ເພີ່ມສິນຄ້າໃສ່ກະຕ່າ ----
// ຮອງຮັບທັງ 2 ແບບ: ຖ້າສົ່ງມາຈາກ JS (fetch, header X-Requested-With) ຈະຕອບກັບ JSON
// ໂດຍບໍ່ redirect (ໃຫ້ໜ້າເວັບບໍ່ເດັ້ງ), ຖ້າບໍ່ແມ່ນ (ບໍ່ມີ JS) ຈະ redirect ຄືເກົ່າ
router.post('/add', async (req, res) => {
  const isAjax = req.get('X-Requested-With') === 'XMLHttpRequest';
  try {
    const { product_id, variant_id, quantity } = req.body;
    const cart = await getOrCreateCart(req.session.user.id);

    const { data: existing } = await supabase
      .from('cart_items').select('*')
      .eq('cart_id', cart.id).eq('product_id', product_id)
      .eq('variant_id', variant_id || null).maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from('cart_items')
        .update({ quantity: existing.quantity + Number(quantity || 1) })
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase.from('cart_items').insert({
        cart_id: cart.id,
        product_id,
        variant_id: variant_id || null,
        quantity: Number(quantity || 1)
      }));
    }
    if (error) throw error;

    const cartCount = await countCartItems(cart.id);
    req.session.cartCount = cartCount;

    if (isAjax) {
      return res.json({ success: true, message: `ເພີ່ມສິນຄ້າ ${quantity || 1} ຊິ້ນໃສ່ກະຕ່າສຳເລັດ 🛒`, cartCount });
    }
    setFlash(req, 'success', 'ເພີ່ມສິນຄ້າໃສ່ກະຕ່າສຳເລັດ 🛒');
    res.redirect('/cart');
  } catch (err) {
    console.error('cart/add error:', err.message);
    if (isAjax) {
      return res.status(400).json({ success: false, message: 'ເພີ່ມສິນຄ້າບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່' });
    }
    setFlash(req, 'error', 'ເພີ່ມສິນຄ້າບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່');
    res.redirect(req.get('Referer') || '/products');
  }
});

// ---- ອັບເດດຈຳນວນ ----
router.post('/update/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    let error;
    if (Number(quantity) <= 0) {
      ({ error } = await supabase.from('cart_items').delete().eq('id', req.params.itemId));
    } else {
      ({ error } = await supabase.from('cart_items').update({ quantity: Number(quantity) }).eq('id', req.params.itemId));
    }
    if (error) throw error;
    const cart = await getOrCreateCart(req.session.user.id);
    req.session.cartCount = await countCartItems(cart.id);
    setFlash(req, 'success', 'ອັບເດດກະຕ່າສຳເລັດ');
    res.redirect('/cart');
  } catch (err) {
    console.error('cart/update error:', err.message);
    setFlash(req, 'error', 'ອັບເດດກະຕ່າບໍ່ສຳເລັດ');
    res.redirect('/cart');
  }
});

// ---- ລຶບສິນຄ້າອອກຈາກກະຕ່າ ----
router.post('/remove/:itemId', async (req, res) => {
  try {
    const { error } = await supabase.from('cart_items').delete().eq('id', req.params.itemId);
    if (error) throw error;
    const cart = await getOrCreateCart(req.session.user.id);
    req.session.cartCount = await countCartItems(cart.id);
    setFlash(req, 'success', 'ລຶບສິນຄ້າອອກຈາກກະຕ່າແລ້ວ');
    res.redirect('/cart');
  } catch (err) {
    console.error('cart/remove error:', err.message);
    setFlash(req, 'error', 'ລຶບສິນຄ້າບໍ່ສຳເລັດ');
    res.redirect('/cart');
  }
});

module.exports = router;
