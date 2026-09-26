const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');

// ---- ໜ້າຫລັກ (Homepage) ----
router.get('/', async (req, res) => {
  const { data: banners } = await supabase
    .from('banners').select('*').eq('active', true).order('sort_order');

  const { data: categories } = await supabase
    .from('categories').select('*').is('parent_id', null).order('sort_order');

  const { data: featuredRaw } = await supabase
    .from('products').select('*, product_images(*)')
    .eq('status', 'active').eq('is_featured', true).limit(8);

  const { data: newest } = await supabase
    .from('products').select('*, product_images(*)')
    .eq('status', 'active').order('created_at', { ascending: false }).limit(8);

  // ຖ້າຍັງບໍ່ທັນມີສິນຄ້າຖືກຕັ້ງເປັນ "ແນະນຳ" (is_featured), ໃຫ້ໃຊ້ສິນຄ້າມາໃໝ່ແທນຊົ່ວຄາວ
  // (ໄປຕັ້ງ is_featured ຢູ່ໜ້າແກ້ໄຂສິນຄ້າໃນ Admin ເພື່ອເລືອກເອງ)
  const featured = (featuredRaw && featuredRaw.length > 0) ? featuredRaw : newest;

  res.render('index', {
    title: 'Lynn - ຊື້ສະບາຍ ຄືກັນຢູ່ບ້ານ',
    banners: banners || [],
    categories: categories || [],
    featured: featured || [],
    newest: newest || []
  });
});

// ---- ລາຍການສິນຄ້າ / ຄົ້ນຫາ / ກັ່ນຕອງ ----
router.get('/products', async (req, res) => {
  const { q, category, sort, page = 1 } = req.query;
  const perPage = 12;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from('products')
    .select('*, product_images(*), categories(name,slug)', { count: 'exact' })
    .eq('status', 'active');

  if (q) query = query.ilike('name', `%${q}%`);
  if (category) query = query.eq('categories.slug', category);

  if (sort === 'price_asc') query = query.order('price', { ascending: true });
  else if (sort === 'price_desc') query = query.order('price', { ascending: false });
  else if (sort === 'bestseller') query = query.order('sold_count', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  const { data: products, count } = await query.range(from, to);
  const { data: categories } = await supabase.from('categories').select('*').is('parent_id', null);

  res.render('products/list', {
    title: q ? `ຄົ້ນຫາ: ${q}` : 'ສິນຄ້າທັງໝົດ',
    products: products || [],
    categories: categories || [],
    q: q || '',
    activeCategory: category || '',
    sort: sort || '',
    page: Number(page),
    totalPages: Math.max(1, Math.ceil((count || 0) / perPage))
  });
});

// ---- ໜ້າລາຍລະອຽດສິນຄ້າ ----
router.get('/products/:slug', async (req, res) => {
  const { data: product } = await supabase
    .from('products')
    .select('*, product_images(*), product_variants(*), categories(name,slug)')
    .eq('slug', req.params.slug)
    .single();

  if (!product) return res.status(404).render('error', { message: 'ບໍ່ພົບສິນຄ້ານີ້' });

  const { data: reviews } = await supabase
    .from('reviews').select('*, profiles(full_name)')
    .eq('product_id', product.id).order('created_at', { ascending: false });

  const { data: related } = await supabase
    .from('products').select('*, product_images(*)')
    .eq('category_id', product.category_id).neq('id', product.id).limit(6);

  res.render('products/detail', {
    title: product.name,
    product,
    reviews: reviews || [],
    related: related || []
  });
});

module.exports = router;
