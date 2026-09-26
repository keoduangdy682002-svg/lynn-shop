# 🌿 Lynn — ເວັບຂາຍເຄື່ອງອອນໄລນ໌

Node.js + Express + EJS + Supabase (PostgreSQL) online store, styled with a
natural green palette.

## ໂຄງສ້າງລະບົບ (Menus ທີ່ຮອງຮັບແລ້ວ)

**ຝັ່ງລູກຄ້າ (Storefront)**
- ໜ້າຫລັກ: banner slider, ໝວດໝູ່, ສິນຄ້າແນະນຳ, ສິນຄ້າມາໃໝ່
- ຄົ້ນຫາ + ກັ່ນຕອງ + ລຽງລຳດັບ (ລາຄາ/ຂາຍດີ) + ໜ້າແບ່ງໜ້າ (pagination)
- ໜ້າລາຍລະອຽດສິນຄ້າ: gallery, **ຮູບຕົວເລືອກສີ/ໄຊ້ (variant swatches) ກົດປ່ຽນຮູບໄດ້**,
  **ສິນຄ້າແນະນຳ sidebar ຂວາມືຈາກໝວດດຽວກັນ**, ລີວິວ
- ກະຕ່າສິນຄ້າ (persist ໃນຖານຂໍ້ມູນ)
- Checkout: ທີ່ຢູ່ຈັດສົ່ງ, ວິທີຊຳລະເງິນ (COD / ໂອນ), ຄິດໄລ່ຄ່າສົ່ງ
- ສະໝັກສະມາຊິກ / ເຂົ້າສູ່ລະບົບ (Supabase Auth)
- ປະຫວັດການສັ່ງຊື້ (My Orders) → **ກົດເບິ່ງລາຍລະອຽດແຕ່ລະບິນໄດ້ ລວມທັງ tracking number ແລະ ຮູບບິນຝາກເຄື່ອງ**

**ຝັ່ງແອັດມິນ (/admin)**
- Dashboard: ສະຖິຕິ ສິນຄ້າ/ອໍເດີ/ສະມາຊິກ
- ຈັດການສິນຄ້າ: ເພີ່ມ/ລຶບ, **ອັບໂຫລດຮູບຫລັກຈາກເຄື່ອງ**, **ເພີ່ມຕົວເລືອກ (variant) ພ້ອມຮູບແຕ່ລະສີ**
- ຈັດການໝວດໝູ່
- ຈັດການອໍເດີ + ປ່ຽນສະຖານະ + **ໃສ່ເລກ tracking + ອັບໂຫລດຮູບບິນຝາກເຄື່ອງ (ໂດຍສະເພາະຕອນປ່ຽນເປັນ "shipped")**

**ຍັງບໍ່ໄດ້ເຮັດ (extension points, ໂຄງສ້າງ DB ຮອງຮັບແລ້ວ)**
- ຄູປອງສ່ວນຫລຸດ (ຕາຕະລາງ `coupons` ມີແລ້ວ)
- Wishlist UI (ຕາຕະລາງ `wishlists` ມີແລ້ວ)
- ຊຳລະເງິນອອນໄລນ໌ຈິງ (ຕາຕະລາງ `payments` ພ້ອມຮັບ gateway)
- ແກ້ໄຂສິນຄ້າ (ປັດຈຸບັນມີແຕ່ ເພີ່ມ/ລຶບ)

## ໂຄງສ້າງຖານຂໍ້ມູນ

ເບິ່ງໄຟລ໌ `supabase/schema.sql` — ມີ 13 ຕາຕະລາງຫລັກ:
`profiles, addresses, categories, products, product_images, product_variants,
carts, cart_items, orders, order_items, payments, reviews, wishlists,
coupons, banners` ພ້ອມ Row Level Security (RLS) ພື້ນຖານ.

## ຕິດຕັ້ງໃຊ້ງານ (Local)

1. **ສ້າງໂປຣເຈັກໃນ Supabase**
   - ໄປທີ່ https://supabase.com → New Project
   - ເປີດ **SQL Editor** → paste ເນື້ອໃນຈາກ `supabase/schema.sql` → Run
   - ໄປທີ່ **Project Settings > API** → ສຳເນົາ `Project URL`, `anon key`, `service_role key`

2. **ຖ້າໂປເຈັກ Supabase ຂອງທ່ານມີຢູ່ແລ້ວ (ອັບເດດຈາກເວີຊັ່ນເກົ່າ)**
   - ໄປ SQL Editor → ຮັນເນື້ອໃນຈາກ `supabase/migration_v2.sql` (ເພີ່ມ column ໃໝ່: ບິນຝາກເຄື່ອງ, tracking number, ຮູບ variant)

3. **ສ້າງ Storage bucket ສຳລັບເກັບຮູບອັບໂຫລດ**
   - ໄປ Supabase Dashboard → ເມນູຊ້າຍ **Storage** → **New bucket**
   - ຕັ້ງຊື່: `lynn-uploads`
   - ເປີດ **Public bucket** = ON (ໃຫ້ລູກຄ້າເບິ່ງຮູບໄດ້ໂດຍກົງຜ່ານລິ້ງ)
   - ກົດ **Create bucket**

4. **ຕັ້ງຄ່າໂປຣເຈັກ**
   ```bash
   npm install
   cp .env.example .env
   # ແກ້ .env ໃສ່ຄ່າ Supabase ຂອງທ່ານ
   npm run dev
   ```
   ເປີດ http://localhost:3000

5. **ສ້າງບັນຊີ Admin ຄົນທຳອິດ**
   - ສະໝັກສະມາຊິກປົກກະຕິຜ່ານໜ້າເວັບ
   - ໄປທີ່ Supabase Dashboard > Table Editor > `profiles`
   - ຫາແຖວຜູ້ໃຊ້ນັ້ນ ແລ້ວປ່ຽນ `role` ຈາກ `customer` ເປັນ `admin`
   - Login ໃໝ່ ຈະເຫັນເມນູ "⚙️ ຈັດການລະບົບ"

## Deploy ຂຶ້ນ GitHub + Render

1. **Push ຂຶ້ນ GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Lynn shop"
   git branch -M main
   git remote add origin https://github.com/<your-username>/lynn-shop.git
   git push -u origin main
   ```

2. **Deploy ດ້ວຍ Render**
   - ໄປ https://render.com → New > Web Service
   - ເຊື່ອມຕໍ່ GitHub repo `lynn-shop`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - ໃສ່ Environment Variables (ຄືກັນກັບ `.env`):
     `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`,
     `SESSION_SECRET`, `NODE_ENV=production`
   - Deploy — Render ຈະໃຫ້ URL ສາທາລະນະ ເຊັ່ນ `https://lynn-shop.onrender.com`

## Tech Stack
- **Backend:** Node.js, Express, EJS (server-rendered views)
- **Database/Auth:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Hosting:** Render (Web Service) + GitHub (source control)
- **Style:** custom CSS, green nature theme (see `public/css/style.css`
  design tokens at the top of the file)
