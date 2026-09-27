const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { requireAuth, requireAdmin, setFlash } = require('../middleware/auth');
const { upload, uploadFile } = require('../utils/upload');

router.use(requireAuth, requireAdmin);

// ---- Dashboard ----
router.get('/', async (req, res) => {
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  const { data: recentOrders } = await supabase
    .from('orders').select('*').order('created_at', { ascending: false }).limit(10);

  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
    productCount, orderCount, userCount, recentOrders: recentOrders || []
  });
});

// =====================================================================
// ສິນຄ້າ
// =====================================================================

router.get('/products', async (req, res) => {
  const { data: products } = await supabase
    .from('products').select('*, categories(name)').order('created_at', { ascending: false });
  res.render('admin/products', { title: 'ຈັດການສິນຄ້າ', products: products || [] });
});

router.get('/products/new', async (req, res) => {
  const { data: categories } = await supabase.from('categories').select('*');
  res.render('admin/product-form', { title: 'ເພີ່ມສິນຄ້າໃໝ່', product: null, categories: categories || [] });
});

router.post('/products/new', upload.fields([
  { name: 'image_file', maxCount: 1 },
  { name: 'variant_images', maxCount: 12 }
]), async (req, res) => {
  try {
    const { name, slug, description, price, compare_price, stock, category_id, sku, image_url, is_featured } = req.body;

    if (!name || !slug || !price || stock === undefined || stock === '') {
      setFlash(req, 'error', 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ (ຊື່, slug, ລາຄາ, ສະຕັອກ)');
      return res.redirect('/admin/products/new');
    }

    let mainImageUrl = image_url || null;
    const mainFile = req.files?.image_file?.[0];
    if (mainFile) mainImageUrl = await uploadFile(mainFile, 'products');

    const { data: product, error } = await supabase.from('products').insert({
      name, slug, description, price, compare_price: compare_price || null,
      stock, category_id: category_id || null, sku: sku || null,
      is_featured: is_featured === 'on'
    }).select().single();
    if (error) throw error;

    if (mainImageUrl) {
      await supabase.from('product_images').insert({ product_id: product.id, image_url: mainImageUrl, sort_order: 0 });
    }

    const names = [].concat(req.body.variant_name || []);
    const extraPrices = [].concat(req.body.variant_extra_price || []);
    const stocks = [].concat(req.body.variant_stock || []);
    const variantFiles = req.files?.variant_images || [];

    for (let i = 0; i < names.length; i++) {
      if (!names[i]) continue;
      let variantImageUrl = null;
      if (variantFiles[i]) variantImageUrl = await uploadFile(variantFiles[i], 'variants');
      await supabase.from('product_variants').insert({
        product_id: product.id, name: names[i],
        extra_price: extraPrices[i] || 0, stock: stocks[i] || 0, image_url: variantImageUrl
      });
    }

    setFlash(req, 'success', `ເພີ່ມສິນຄ້າ "${name}" ສຳເລັດ ✅`);
    res.redirect('/admin/products');
  } catch (err) {
    console.error('admin/products/new error:', err.message);
    const msg = err.message?.includes('duplicate')
      ? 'Slug ຫລື SKU ນີ້ຖືກໃຊ້ແລ້ວ ກະລຸນາປ່ຽນ'
      : (err.message || 'ເພີ່ມສິນຄ້າບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່');
    setFlash(req, 'error', msg);
    res.redirect('/admin/products/new');
  }
});

// ---- ແກ້ໄຂສິນຄ້າ ----
router.get('/products/:id/edit', async (req, res) => {
  const { data: product } = await supabase
    .from('products').select('*, product_images(*), product_variants(*)').eq('id', req.params.id).single();
  if (!product) {
    setFlash(req, 'error', 'ບໍ່ພົບສິນຄ້ານີ້');
    return res.redirect('/admin/products');
  }
  const { data: categories } = await supabase.from('categories').select('*');
  res.render('admin/product-form', { title: `ແກ້ໄຂ: ${product.name}`, product, categories: categories || [] });
});

router.post('/products/:id/edit', upload.fields([
  { name: 'image_file', maxCount: 1 },
  { name: 'variant_images', maxCount: 12 }
]), async (req, res) => {
  const productId = req.params.id;
  try {
    const { name, slug, description, price, compare_price, stock, category_id, sku, image_url, is_featured } = req.body;

    const updateData = {
      name, slug, description, price, compare_price: compare_price || null,
      stock, category_id: category_id || null, sku: sku || null,
      is_featured: is_featured === 'on'
    };

    const mainFile = req.files?.image_file?.[0];
    if (mainFile) {
      const newUrl = await uploadFile(mainFile, 'products');
      // ແທນຮູບຫລັກເກົ່າ (sort_order = 0) ດ້ວຍຮູບໃໝ່
      const { data: existingImg } = await supabase
        .from('product_images').select('*').eq('product_id', productId).eq('sort_order', 0).maybeSingle();
      if (existingImg) {
        await supabase.from('product_images').update({ image_url: newUrl }).eq('id', existingImg.id);
      } else {
        await supabase.from('product_images').insert({ product_id: productId, image_url: newUrl, sort_order: 0 });
      }
    } else if (image_url) {
      const { data: existingImg } = await supabase
        .from('product_images').select('*').eq('product_id', productId).eq('sort_order', 0).maybeSingle();
      if (existingImg) {
        await supabase.from('product_images').update({ image_url }).eq('id', existingImg.id);
      } else {
        await supabase.from('product_images').insert({ product_id: productId, image_url, sort_order: 0 });
      }
    }

    const { error } = await supabase.from('products').update(updateData).eq('id', productId);
    if (error) throw error;

    // ເພີ່ມ variant ໃໝ່ (ຖ້າມີ) — variant ເກົ່າ ລຶບແຍກຕ່າງຫາກຈາກໜ້າແກ້ໄຂ
    const names = [].concat(req.body.variant_name || []);
    const extraPrices = [].concat(req.body.variant_extra_price || []);
    const stocks = [].concat(req.body.variant_stock || []);
    const variantFiles = req.files?.variant_images || [];
    for (let i = 0; i < names.length; i++) {
      if (!names[i]) continue;
      let variantImageUrl = null;
      if (variantFiles[i]) variantImageUrl = await uploadFile(variantFiles[i], 'variants');
      await supabase.from('product_variants').insert({
        product_id: productId, name: names[i],
        extra_price: extraPrices[i] || 0, stock: stocks[i] || 0, image_url: variantImageUrl
      });
    }

    setFlash(req, 'success', `ອັບເດດສິນຄ້າ "${name}" ສຳເລັດ ✅`);
    res.redirect('/admin/products');
  } catch (err) {
    console.error('admin/products/edit error:', err.message);
    setFlash(req, 'error', err.message || 'ແກ້ໄຂສິນຄ້າບໍ່ສຳເລັດ');
    res.redirect(`/admin/products/${productId}/edit`);
  }
});

// ---- ລຶບ variant ອັນໜຶ່ງ (ໃຊ້ຈາກໜ້າແກ້ໄຂສິນຄ້າ) ----
router.post('/products/:id/variants/:variantId/delete', async (req, res) => {
  try {
    await supabase.from('product_variants').delete().eq('id', req.params.variantId);
    setFlash(req, 'success', 'ລຶບຕົວເລືອກສຳເລັດ');
  } catch (err) {
    setFlash(req, 'error', 'ລຶບຕົວເລືອກບໍ່ສຳເລັດ');
  }
  res.redirect(`/admin/products/${req.params.id}/edit`);
});

router.post('/products/:id/delete', async (req, res) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    setFlash(req, 'success', 'ລຶບສິນຄ້າສຳເລັດ');
  } catch (err) {
    console.error('admin/products/delete error:', err.message);
    setFlash(req, 'error', 'ລຶບສິນຄ້າບໍ່ສຳເລັດ');
  }
  res.redirect('/admin/products');
});

// =====================================================================
// ອໍເດີ
// =====================================================================

router.get('/orders', async (req, res) => {
  const { data: orders } = await supabase
    .from('orders').select('*, profiles(full_name,phone)').order('created_at', { ascending: false });
  res.render('admin/orders', { title: 'ຈັດການອໍເດີ', orders: orders || [] });
});

// ---- ບິນເຕັມ (ສຳລັບແອັດມິນເບິ່ງເພື່ອຈັດເຄື່ອງ) ----
router.get('/orders/:id', async (req, res) => {
  const { data: order } = await supabase
    .from('orders').select('*, order_items(*), profiles(full_name,phone), shipping_companies(name)').eq('id', req.params.id).single();
  if (!order) {
    setFlash(req, 'error', 'ບໍ່ພົບອໍເດີນີ້');
    return res.redirect('/admin/orders');
  }
  res.render('admin/order-detail', { title: `ບິນ #${order.order_no}`, order });
});

router.post('/orders/:id/status', upload.single('shipping_proof'), async (req, res) => {
  try {
    const { status, tracking_number } = req.body;
    const updateData = { status };
    if (tracking_number) updateData.tracking_number = tracking_number;
    if (req.file) updateData.shipping_proof_url = await uploadFile(req.file, 'shipping-proof');
    if (status === 'shipped') updateData.shipped_at = new Date().toISOString();

    const { error } = await supabase.from('orders').update(updateData).eq('id', req.params.id);
    if (error) throw error;
    setFlash(req, 'success', `ອັບເດດອໍເດີເປັນ "${status}" ສຳເລັດ${req.file ? ' ພ້ອມແນບບິນຝາກເຄື່ອງ 📎' : ''}`);
  } catch (err) {
    console.error('admin/orders/status error:', err.message);
    setFlash(req, 'error', err.message || 'ອັບເດດສະຖານະບໍ່ສຳເລັດ');
  }
  res.redirect(req.get('Referer') || '/admin/orders');
});

// =====================================================================
// ໝວດໝູ່
// =====================================================================

router.get('/categories', async (req, res) => {
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order');
  res.render('admin/categories', { title: 'ຈັດການໝວດໝູ່', categories: categories || [] });
});

router.post('/categories/new', upload.single('image_file'), async (req, res) => {
  try {
    const { name, slug, image_url } = req.body;
    if (!name || !slug) {
      setFlash(req, 'error', 'ກະລຸນາປ້ອນຊື່ ແລະ slug ໃຫ້ຄົບ');
      return res.redirect('/admin/categories');
    }
    let finalImageUrl = image_url || null;
    if (req.file) finalImageUrl = await uploadFile(req.file, 'categories');

    const { error } = await supabase.from('categories').insert({ name, slug, image_url: finalImageUrl });
    if (error) throw error;
    setFlash(req, 'success', `ເພີ່ມໝວດໝູ່ "${name}" ສຳເລັດ ✅`);
  } catch (err) {
    console.error('admin/categories/new error:', err.message);
    const msg = err.message?.includes('duplicate')
      ? 'Slug ໝວດໝູ່ນີ້ຖືກໃຊ້ແລ້ວ ກະລຸນາປ່ຽນ'
      : (err.message || 'ເພີ່ມໝວດໝູ່ບໍ່ສຳເລັດ');
    setFlash(req, 'error', msg);
  }
  res.redirect('/admin/categories');
});

router.get('/categories/:id/edit', async (req, res) => {
  const { data: category } = await supabase.from('categories').select('*').eq('id', req.params.id).single();
  if (!category) {
    setFlash(req, 'error', 'ບໍ່ພົບໝວດໝູ່ນີ້');
    return res.redirect('/admin/categories');
  }
  res.render('admin/category-edit', { title: `ແກ້ໄຂ: ${category.name}`, category });
});

router.post('/categories/:id/edit', upload.single('image_file'), async (req, res) => {
  try {
    const { name, slug, image_url } = req.body;
    const updateData = { name, slug };
    if (req.file) updateData.image_url = await uploadFile(req.file, 'categories');
    else if (image_url) updateData.image_url = image_url;

    const { error } = await supabase.from('categories').update(updateData).eq('id', req.params.id);
    if (error) throw error;
    setFlash(req, 'success', `ອັບເດດໝວດໝູ່ "${name}" ສຳເລັດ ✅`);
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('admin/categories/edit error:', err.message);
    setFlash(req, 'error', err.message || 'ອັບເດດໝວດໝູ່ບໍ່ສຳເລັດ');
    res.redirect(`/admin/categories/${req.params.id}/edit`);
  }
});

router.post('/categories/:id/delete', async (req, res) => {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) throw error;
    setFlash(req, 'success', 'ລຶບໝວດໝູ່ສຳເລັດ');
  } catch (err) {
    console.error('admin/categories/delete error:', err.message);
    setFlash(req, 'error', 'ລຶບໝວດໝູ່ບໍ່ສຳເລັດ (ອາດຍັງມີສິນຄ້າໃນໝວດນີ້ຢູ່)');
  }
  res.redirect('/admin/categories');
});

// =====================================================================
// ຂົນສົ່ງ (Shipping Companies)
// =====================================================================

router.get('/shipping', async (req, res) => {
  const { data: companies } = await supabase.from('shipping_companies').select('*').order('sort_order');
  res.render('admin/shipping', { title: 'ຈັດການຂົນສົ່ງ', companies: companies || [] });
});

router.post('/shipping/new', upload.single('qr_image'), async (req, res) => {
  try {
    const { name, supports_cod } = req.body;
    if (!name) {
      setFlash(req, 'error', 'ກະລຸນາປ້ອນຊື່ບໍລິສັດຂົນສົ່ງ');
      return res.redirect('/admin/shipping');
    }
    let qrImageUrl = null;
    if (req.file) qrImageUrl = await uploadFile(req.file, 'shipping-qr');

    const { error } = await supabase.from('shipping_companies').insert({
      name, supports_cod: supports_cod === 'on', qr_image_url: qrImageUrl
    });
    if (error) throw error;
    setFlash(req, 'success', `ເພີ່ມຂົນສົ່ງ "${name}" ສຳເລັດ ✅`);
  } catch (err) {
    console.error('admin/shipping/new error:', err.message);
    setFlash(req, 'error', 'ເພີ່ມຂົນສົ່ງບໍ່ສຳເລັດ');
  }
  res.redirect('/admin/shipping');
});

router.get('/shipping/:id/edit', async (req, res) => {
  const { data: company } = await supabase.from('shipping_companies').select('*').eq('id', req.params.id).single();
  if (!company) {
    setFlash(req, 'error', 'ບໍ່ພົບຂົນສົ່ງນີ້');
    return res.redirect('/admin/shipping');
  }
  res.render('admin/shipping-edit', { title: `ແກ້ໄຂ: ${company.name}`, company });
});

router.post('/shipping/:id/edit', upload.single('qr_image'), async (req, res) => {
  try {
    const { name, supports_cod, active } = req.body;
    const updateData = { name, supports_cod: supports_cod === 'on', active: active === 'on' };
    if (req.file) updateData.qr_image_url = await uploadFile(req.file, 'shipping-qr');

    const { error } = await supabase.from('shipping_companies').update(updateData).eq('id', req.params.id);
    if (error) throw error;
    setFlash(req, 'success', `ອັບເດດຂົນສົ່ງ "${name}" ສຳເລັດ ✅`);
    res.redirect('/admin/shipping');
  } catch (err) {
    console.error('admin/shipping/edit error:', err.message);
    setFlash(req, 'error', 'ອັບເດດຂົນສົ່ງບໍ່ສຳເລັດ');
    res.redirect(`/admin/shipping/${req.params.id}/edit`);
  }
});

router.post('/shipping/:id/delete', async (req, res) => {
  try {
    const { error } = await supabase.from('shipping_companies').delete().eq('id', req.params.id);
    if (error) throw error;
    setFlash(req, 'success', 'ລຶບຂົນສົ່ງສຳເລັດ');
  } catch (err) {
    console.error('admin/shipping/delete error:', err.message);
    setFlash(req, 'error', 'ລຶບບໍ່ສຳເລັດ (ອາດຍັງມີອໍເດີໃຊ້ຂົນສົ່ງນີ້ຢູ່)');
  }
  res.redirect('/admin/shipping');
});

// ---- ຢືນຢັນວ່າໄດ້ຮັບເງິນແລ້ວ (ຈາກຮູບຫລັກຖານໂອນເງິນຂອງລູກຄ້າ) ----
router.post('/orders/:id/confirm-payment', async (req, res) => {
  try {
    const { error } = await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', req.params.id);
    if (error) throw error;
    setFlash(req, 'success', 'ຢືນຢັນການຮັບເງິນສຳເລັດ');
  } catch (err) {
    setFlash(req, 'error', 'ຢືນຢັນບໍ່ສຳເລັດ');
  }
  res.redirect(req.get('Referer') || '/admin/orders');
});

module.exports = router;
