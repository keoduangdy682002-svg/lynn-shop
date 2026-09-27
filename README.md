# 🌿 Lynn — ເວັບຂາຍເຄື່ອງອອນໄລນ໌

Node.js + Express + EJS + Supabase (PostgreSQL) online store, styled with a
natural green palette.

## ໂຄງສ້າງລະບົບ (Menus ທີ່ຮອງຮັບແລ້ວ)

**ຝັ່ງລູກຄ້າ (Storefront)**
- ໜ້າຫລັກ: banner slider, ໝວດໝູ່, ສິນຄ້າແນະນຳ, ສິນຄ້າມາໃໝ່
- ຄົ້ນຫາ + ກັ່ນຕອງ + ລຽງລຳດັບ (ລາຄາ/ຂາຍດີ) + ໜ້າແບ່ງໜ້າ (pagination)
- ໜ້າລາຍລະອຽດສິນຄ້າ: gallery, ຮູບຕົວເລືອກສີ/ໄຊ້ (variant swatches) ກົດປ່ຽນຮູບໄດ້,
  ສິນຄ້າແນະນຳ sidebar ຂວາມືຈາກໝວດດຽວກັນ, ລີວິວ
- ເພີ່ມໃສ່ກະຕ່າແບບບໍ່ເດັ້ງໜ້າ (popup ແຈ້ງເຕືອນ + badge ອັບເດດທັນທີ) — ຖ້າຍັງບໍ່ login ຈະຂຶ້ນ popup ເຊີນຊວນ ແລ້ວພາໄປໜ້າສະໝັກສະມາຊິກ
- Checkout: ທີ່ຢູ່ຈັດສົ່ງ, **ເລືອກບໍລິສັດຂົນສົ່ງ** (ລະບົບຮູ້ວ່າແຕ່ລະບໍລິສັດຮັບ COD ໄດ້ບໍ່), ຖ້າຂົນສົ່ງນັ້ນບໍ່ຮັບ COD ຈະບັງຄັບໃຫ້ສະແກນ QR ຈ່າຍເງິນ ແລະ ແນບຫລັກຖານກ່ອນຢືນຢັນສັ່ງຊື້
- ສະໝັກສະມາຊິກ / ເຂົ້າສູ່ລະບົບ ດ້ວຍ ອີເມວ, ເບີໂທ, ຫລື Google/Facebook (Supabase Auth)
- ປະຫວັດການສັ່ງຊື້ (My Orders) → ກົດເບິ່ງລາຍລະອຽດແຕ່ລະບິນໄດ້ ລວມທັງ tracking number, ຂົນສົ່ງທີ່ເລືອກ, ຮູບບິນຝາກເຄື່ອງ ແລະ ຫລັກຖານການໂອນເງິນຂອງຕົນເອງ

**ຝັ່ງແອັດມິນ (/admin)**
- Dashboard: ສະຖິຕິ ສິນຄ້າ/ອໍເດີ/ສະມາຊິກ
- ຈັດການສິນຄ້າ: ເພີ່ມ/ແກ້ໄຂ/ລຶບ, ອັບໂຫລດຮູບຫລັກຈາກເຄື່ອງ, ເພີ່ມຕົວເລືອກ (variant) ພ້ອມຮູບແຕ່ລະສີ, ຕັ້ງ "ສິນຄ້າແນະນຳ"
- ຈັດການໝວດໝູ່: ເພີ່ມ/ແກ້ໄຂ/ລຶບ, ອັບໂຫລດຮູບຈາກເຄື່ອງ ຫລືໃສ່ລິ້ງ
- **ຈັດການບໍລິສັດຂົນສົ່ງ**: ເພີ່ມ/ແກ້ໄຂ/ລຶບ, ກຳນົດວ່າຮັບ COD ໄດ້ບໍ່, ອັບໂຫລດຮູບ QR ຈ່າຍເງິນ
- ຈັດການອໍເດີ: ເບິ່ງບິນເຕັມ (ສຳລັບຈັດເຄື່ອງ), ປ່ຽນສະຖານະ + ໃສ່ເລກ tracking + ອັບໂຫລດຮູບບິນຝາກເຄື່ອງ, ເບິ່ງ/ຢືນຢັນຫລັກຖານການໂອນເງິນຈາກລູກຄ້າ

**ຍັງບໍ່ໄດ້ເຮັດ (extension points, ໂຄງສ້າງ DB ຮອງຮັບແລ້ວ)**
- ຄູປອງສ່ວນຫລຸດ (ຕາຕະລາງ `coupons` ມີແລ້ວ)
- Wishlist UI (ຕາຕະລາງ `wishlists` ມີແລ້ວ)
- ຊຳລະເງິນອອນໄລນ໌ຈິງຜ່ານ gateway (ຕາຕະລາງ `payments` ພ້ອມຮັບ)
- SMS OTP ຢືນຢັນເບີໂທຈິງ (ຕ້ອງຕໍ່ SMS gateway ເຊັ່ນ Twilio ເພີ່ມ, ມີຄ່າໃຊ້ຈ່າຍ)

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
   - ໄປ SQL Editor → ຮັນເນື້ອໃນຈາກ `supabase/migration_v2.sql` (ຖ້າຍັງບໍ່ທັນຮັນ)
   - ຈາກນັ້ນຮັນເນື້ອໃນຈາກ `supabase/migration_v3.sql` (ເພີ່ມ: ຕາຕະລາງບໍລິສັດຂົນສົ່ງ, ຫລັກຖານໂອນເງິນ, email ໃນ profiles)

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

6. **ເປີດໃຊ້ Google / Facebook Login (ຕົວເລືອກ, ຖ້າຢາກໃຊ້)**

   ຟິວເຈີ "ເຂົ້າສູ່ລະບົບດ້ວຍ Google/Facebook" ຕ້ອງຕັ້ງຄ່າໃນ Supabase Dashboard ກ່ອນຈຶ່ງຈະໃຊ້ໄດ້ (ບໍ່ແມ່ນຕັ້ງຄ່າຜ່ານໂຄດ):

   - ໄປ Supabase Dashboard → **Authentication** → **Providers**
   - ເປີດ **Google**: ຕ້ອງໄປສ້າງ OAuth Client ໃນ https://console.cloud.google.com ກ່ອນ (Client ID + Client Secret), ຄັດລອກ Redirect URL ທີ່ Supabase ໃຫ້ ໄປໃສ່ໃນ Google Console
   - ເປີດ **Facebook**: ຕ້ອງໄປສ້າງ App ໃນ https://developers.facebook.com ກ່ອນ (App ID + App Secret), ຄັດລອກ Redirect URL ດຽວກັນ
   - ໄປ Supabase → **Authentication → URL Configuration** → ເພີ່ມ `https://<ໂດເມນເວັບຂອງທ່ານ>/auth/social-callback` ເຂົ້າໃນ **Redirect URLs**

   *(ຖ້າຍັງບໍ່ໄດ້ຕັ້ງຄ່ານີ້, ປຸ່ມ Google/Facebook ຈະຂຶ້ນ error — ລູກຄ້າຍັງສະໝັກ/login ດ້ວຍອີເມວ ຫລື ເບີໂທ ໄດ້ປົກກະຕິ)*

   ⚠️ **ໝາຍເຫດ:** ການສະໝັກດ້ວຍ "ເບີໂທ" ໃນລະບົບນີ້ບໍ່ໄດ້ສົ່ງ SMS OTP ຢືນຢັນຈິງ (ຍັງບໍ່ໄດ້ຕໍ່ SMS gateway ເຊັ່ນ Twilio ເຊິ່ງມີຄ່າໃຊ້ຈ່າຍ) — ລະບົບໃຊ້ເບີໂທເປັນ "username" ແທນ email ພາຍໃນເທົ່ານັ້ນ, ລູກຄ້າຕັ້ງລະຫັດຜ່ານເອງ ແລະ ເຂົ້າສູ່ລະບົບໄດ້ທັນທີ ບໍ່ຕ້ອງລໍຖ້າ SMS

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
