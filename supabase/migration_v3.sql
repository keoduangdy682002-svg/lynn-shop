-- =====================================================================
-- LYNN SHOP — Migration v3
-- ຮັນໄຟລ໌ນີ້ໃນ Supabase SQL Editor
-- =====================================================================

-- 1) ຕາຕະລາງບໍລິສັດຂົນສົ່ງ
create table if not exists public.shipping_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  supports_cod boolean not null default true,   -- ເກັບເງິນປາຍທາງໄດ້ ຫລື ບໍ່
  qr_image_url text,                            -- ຮູບຄິວອາໂຄດ ສຳລັບກໍລະນີບໍ່ຮັບ COD
  active boolean not null default true,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

-- 2) ເພີ່ມ column ໃສ່ orders: ເລືອກຂົນສົ່ງໃດ + ຫລັກຖານການໂອນເງິນຈາກລູກຄ້າ
alter table public.orders
  add column if not exists shipping_company_id uuid references public.shipping_companies(id),
  add column if not exists payment_proof_url text;

-- 3) ອະນຸຍາດໃຫ້ທຸກຄົນອ່ານລາຍຊື່ບໍລິສັດຂົນສົ່ງທີ່ active (ໃຊ້ຢູ່ໜ້າ checkout)
alter table public.shipping_companies enable row level security;
create policy "public read active shipping companies" on public.shipping_companies
  for select using (active = true);

-- 4) ເພີ່ມ column email ໃສ່ profiles (ໃຊ້ສຳລັບຜູ້ໃຊ້ທີ່ສະໝັກດ້ວຍເບີໂທ ຫລື social login)
alter table public.profiles
  add column if not exists email text;

-- ຕົວຢ່າງຂໍ້ມູນເລີ່ມຕົ້ນ (ແກ້ໄຂ/ລຶບໄດ້ໃນໜ້າ Admin ພາຍຫລັງ)
insert into public.shipping_companies (name, supports_cod, sort_order) values
  ('ອານຸສານລົດຕູ້', true, 1),
  ('HAL Express', false, 2)
on conflict do nothing;
