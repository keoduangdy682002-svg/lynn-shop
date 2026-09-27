const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { requireAuth, setFlash } = require('../middleware/auth');
const { upload, uploadFile } = require('../utils/upload');

router.use(requireAuth);

// ---- ໜ້າ Checkout ----
router.get('/checkout', async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { data: cart } = await supabase.from('carts').select('*').eq('user_id', userId).maybeSingle();

    if (!cart) {
      setFlash(req, 'error', 'ກະຕ່າຂອງທ່ານຍັງວ່າງ ກະລຸນາເລືອກສິນຄ້າກ່ອນ');
      return res.redirect('/cart');
    }

    const { data: items } = await supabase
      .from('cart_items')
      .select('*, products(*), product_variants(*)')
      .eq('cart_id', cart.id);

    if (!items || items.length === 0) {
      setFlash(req, 'error', 'ກະຕ່າຂອງທ່ານຍັງວ່າງ ກະລຸນາເລືອກສິນຄ້າກ່ອນ');
      return res.redirect('/cart');
    }

    const { data: addresses } = await supabase.from('addresses').select('*').eq('user_id', userId);
    const { data: shippingCompanies } = await supabase
      .from('shipping_companies').select('*').eq('active', true).order('sort_order');

    const subtotal = items.reduce((sum, i) => {
      const price = Number(i.products.price) + Number(i.product_variants?.extra_price || 0);
      return sum + price * i.quantity;
    }, 0);

    res.render('checkout', {
      title: 'ຢືນຢັນການສັ່ງຊື້', items, addresses: addresses || [],
      shippingCompanies: shippingCompanies || [], subtotal
    });
  } catch (err) {
    console.error('checkout GET error:', err.message);
    setFlash(req, 'error', 'ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່');
    res.redirect('/cart');
  }
});

// ---- ສ້າງອໍເດີ (ວາງອໍເດີ) ----
router.post('/checkout', upload.single('payment_proof'), async (req, res) => {
  try {
    const userId = req.session.user.id;
    const {
      receiver_name, phone, province, district, village, detail,
      payment_method, note, shipping_company_id
    } = req.body;

    if (!shipping_company_id) {
      setFlash(req, 'error', 'ກະລຸນາເລືອກບໍລິສັດຂົນສົ່ງ');
      return res.redirect('/orders/checkout');
    }

    const { data: shippingCompany } = await supabase
      .from('shipping_companies').select('*').eq('id', shipping_company_id).single();

    if (!shippingCompany) {
      setFlash(req, 'error', 'ບໍລິສັດຂົນສົ່ງທີ່ເລືອກບໍ່ຖືກຕ້ອງ');
      return res.redirect('/orders/checkout');
    }

    // ຖ້າຂົນສົ່ງທີ່ເລືອກ ບໍ່ຮັບເກັບເງິນປາຍທາງ -> ບັງຄັບຕ້ອງແນບຫລັກຖານການໂອນເງິນ
    let paymentProofUrl = null;
    if (!shippingCompany.supports_cod) {
      if (!req.file) {
        setFlash(req, 'error', `${shippingCompany.name} ບໍ່ຮັບເກັບເງິນປາຍທາງ ກະລຸນາສະແກນ QR ຈ່າຍເງິນ ແລະ ແນບຫລັກຖານກ່ອນສັ່ງຊື້`);
        return res.redirect('/orders/checkout');
      }
      paymentProofUrl = await uploadFile(req.file, 'payment-proof');
    }
    const finalPaymentMethod = shippingCompany.supports_cod ? (payment_method || 'cod') : 'bank_transfer';

    const { data: cart } = await supabase.from('carts').select('*').eq('user_id', userId).maybeSingle();
    if (!cart) {
      setFlash(req, 'error', 'ກະຕ່າຂອງທ່ານຍັງວ່າງ ບໍ່ສາມາດສັ່ງຊື້ໄດ້');
      return res.redirect('/cart');
    }
    const { data: items } = await supabase
      .from('cart_items').select('*, products(*), product_variants(*)').eq('cart_id', cart.id);

    if (!items || items.length === 0) {
      setFlash(req, 'error', 'ກະຕ່າຂອງທ່ານຍັງວ່າງ ບໍ່ສາມາດສັ່ງຊື້ໄດ້');
      return res.redirect('/cart');
    }

    const subtotal = items.reduce((sum, i) => {
      const price = Number(i.products.price) + Number(i.product_variants?.extra_price || 0);
      return sum + price * i.quantity;
    }, 0);
    const shippingFee = subtotal >= 500000 ? 0 : 20000; // ຊື້ເກີນ 500,000 ກີບ ສົ່ງຟຣີ
    const total = subtotal + shippingFee;
    const orderNo = `LYN-${Date.now()}`;

    const { data: order, error: orderError } = await supabase.from('orders').insert({
      order_no: orderNo,
      user_id: userId,
      subtotal, shipping_fee: shippingFee, total,
      shipping_address: { receiver_name, phone, province, district, village, detail },
      shipping_company_id,
      payment_proof_url: paymentProofUrl,
      payment_method: finalPaymentMethod,
      note
    }).select().single();
    if (orderError) throw orderError;

    const orderItems = items.map(i => ({
      order_id: order.id,
      product_id: i.product_id,
      variant_id: i.variant_id,
      product_name: i.products.name,
      unit_price: Number(i.products.price) + Number(i.product_variants?.extra_price || 0),
      quantity: i.quantity,
      line_total: (Number(i.products.price) + Number(i.product_variants?.extra_price || 0)) * i.quantity
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) throw itemsError;

    // ຫລຸດ stock ແລະລ້າງກະຕ່າ
    for (const i of items) {
      await supabase.from('products')
        .update({ stock: i.products.stock - i.quantity, sold_count: i.products.sold_count + i.quantity })
        .eq('id', i.product_id);
    }
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    req.session.cartCount = 0;

    setFlash(req, 'success', `ສັ່ງຊື້ສຳເລັດ! ເລກອໍເດີ ${orderNo} 🎉`);
    res.redirect(`/orders/${order.id}/success`);
  } catch (err) {
    console.error('checkout error:', err.message);
    setFlash(req, 'error', err.message || 'ສັ່ງຊື້ບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່ພາຍຫລັງ');
    res.redirect('/orders/checkout');
  }
});

router.get('/:id/success', async (req, res) => {
  const { data: order } = await supabase
    .from('orders').select('*, order_items(*), shipping_companies(name)').eq('id', req.params.id).single();
  res.render('order-success', { title: 'ສັ່ງຊື້ສຳເລັດ', order });
});

// ---- ລາຍລະອຽດອໍເດີ (ລູກຄ້າກົດເບິ່ງຈາກປະຫວັດການສັ່ງຊື້) ----
router.get('/:id', async (req, res) => {
  const { data: order } = await supabase
    .from('orders').select('*, order_items(*), shipping_companies(name)').eq('id', req.params.id).single();

  if (!order || order.user_id !== req.session.user.id) {
    setFlash(req, 'error', 'ບໍ່ພົບອໍເດີນີ້ ຫລື ທ່ານບໍ່ມີສິດເບິ່ງ');
    return res.redirect('/orders');
  }
  res.render('order-detail', { title: `ອໍເດີ #${order.order_no}`, order });
});

// ---- ປະຫວັດການສັ່ງຊື້ (My Orders) ----
router.get('/', async (req, res) => {
  const { data: orders } = await supabase
    .from('orders').select('*, order_items(*)')
    .eq('user_id', req.session.user.id).order('created_at', { ascending: false });
  res.render('account/orders', { title: 'ປະຫວັດການສັ່ງຊື້', orders: orders || [] });
});

module.exports = router;
