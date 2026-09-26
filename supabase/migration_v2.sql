-- =====================================================================
-- LYNN SHOP — Migration v2
-- ຮັນໄຟລ໌ນີ້ໃນ Supabase SQL Editor (ໂປເຈັກທີ່ມີຢູ່ແລ້ວ, ບໍ່ຕ້ອງຮັນ schema.sql ຄືນ)
-- =====================================================================

-- 1) ບິນຝາກເຄື່ອງ / ຫລັກຖານການຈັດສົ່ງ ຕິດໃສ່ອໍເດີ
alter table public.orders
  add column if not exists shipping_proof_url text,
  add column if not exists tracking_number text,
  add column if not exists shipped_at timestamptz;

-- 2) ຮູບປະຈຳແຕ່ລະ variant (ສີ/ໄຊ້) ຂອງສິນຄ້າ
alter table public.product_variants
  add column if not exists image_url text;

-- =====================================================================
-- Supabase Storage — ສ້າງບ່ອນເກັບຮູບ (ເຮັດຜ່ານ Dashboard, ບໍ່ແມ່ນ SQL)
-- =====================================================================
-- 1. ໄປ Supabase Dashboard > Storage > "New bucket"
-- 2. ຕັ້ງຊື່ bucket: lynn-uploads
-- 3. ເປີດ "Public bucket" = ON  (ໃຫ້ລູກຄ້າເບິ່ງຮູບໄດ້ໂດຍກົງຜ່ານລິ້ງ)
-- 4. ກົດ Create bucket
--
-- ບໍ່ຈຳເປັນຕ້ອງຕັ້ງ Storage Policy ເພີ່ມ ເພາະ server ໃຊ້ service_role key
-- ເຊິ່ງ bypass storage RLS ຢູ່ແລ້ວ (ອັບໂຫລດຈາກຝັ່ງ backend ເທົ່ານັ້ນ)
