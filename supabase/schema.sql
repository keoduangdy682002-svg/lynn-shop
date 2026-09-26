-- =====================================================================
-- LYNN SHOP - Database Schema (Supabase / PostgreSQL)
-- ອອກແບບສຳລັບເວັບຂາຍເຄື່ອງອອນໄລນ໌ (Amazon/Lazada style)
-- Run this in: Supabase Dashboard > SQL Editor
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES  (extends Supabase Auth's built-in auth.users table)
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer','admin','seller')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. ADDRESSES  (ຫລາຍທີ່ຢູ່ຕໍ່ຜູ້ໃຊ້)
-- ---------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text default 'Home',
  receiver_name text not null,
  phone text not null,
  province text,
  district text,
  village text,
  detail text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. CATEGORIES  (ຮອງຮັບ sub-category ໄດ້ ຜ່ານ parent_id)
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  image_url text,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. PRODUCTS
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  seller_id uuid references public.profiles(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  sku text unique,
  price numeric(12,2) not null check (price >= 0),
  compare_price numeric(12,2),           -- ລາຄາເກົ່າ/ລາຄາຫລຸດ (ໂຊ ຂີດຂ້າ)
  stock int not null default 0 check (stock >= 0),
  sold_count int not null default 0,
  rating_avg numeric(3,2) default 0,
  rating_count int default 0,
  status text not null default 'active' check (status in ('active','draft','out_of_stock','archived')),
  is_featured boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_products_category on public.products(category_id);
create index idx_products_status on public.products(status);

-- ---------------------------------------------------------------------
-- 5. PRODUCT IMAGES  (many images per product, gallery)
-- ---------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order int default 0
);

-- ---------------------------------------------------------------------
-- 6. PRODUCT VARIANTS  (ສີ, ໄຊ້, ... ແຕ່ລະຕົວມີລາຄາ/ສະຕັອກແຍກກັນໄດ້)
-- ---------------------------------------------------------------------
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,          -- ຕົວຢ່າງ: "ສີ: ແດງ / ໄຊ້: L"
  image_url text,              -- ຮູບປະຈຳ variant ນີ້ (ເຊັ່ນ ຮູບສີແດງ)
  extra_price numeric(12,2) default 0,
  stock int not null default 0,
  sku text
);

-- ---------------------------------------------------------------------
-- 7. CARTS & CART ITEMS  (persist cart in DB so it survives across devices)
-- ---------------------------------------------------------------------
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_id)
);

-- ---------------------------------------------------------------------
-- 8. ORDERS & ORDER ITEMS
-- ---------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique not null,          -- ລະຫັດອໍເດີ ໃຫ້ລູກຄ້າອ້າງອິງ ເຊັ່ນ LYN-20260925-0001
  user_id uuid not null references public.profiles(id),
  status text not null default 'pending'
    check (status in ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  subtotal numeric(12,2) not null,
  shipping_fee numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  shipping_address jsonb not null,        -- snapshot ຂອງທີ່ຢູ່ ຕອນສັ່ງຊື້
  payment_method text check (payment_method in ('cod','bank_transfer','card')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','failed')),
  coupon_code text,
  note text,
  shipping_proof_url text,        -- ຮູບບິນຝາກເຄື່ອງ/ຫລັກຖານການຈັດສົ່ງ
  tracking_number text,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_orders_user on public.orders(user_id);
create index idx_orders_status on public.orders(status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,             -- snapshot name/price ຕອນຊື້ (ກັນລາຄາປ່ຽນພາຍຫລັງ)
  unit_price numeric(12,2) not null,
  quantity int not null,
  line_total numeric(12,2) not null
);

-- ---------------------------------------------------------------------
-- 9. PAYMENTS  (log ການຊຳລະ - ຮອງຮັບ gateway ໃນອະນາຄົດ)
-- ---------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method text not null,
  amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','success','failed')),
  transaction_ref text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 10. REVIEWS & RATINGS
-- ---------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  image_url text,
  created_at timestamptz not null default now(),
  unique (product_id, user_id, order_id)
);

-- ---------------------------------------------------------------------
-- 11. WISHLIST
-- ---------------------------------------------------------------------
create table public.wishlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------------------------------------------------------------------
-- 12. COUPONS / DISCOUNT CODES
-- ---------------------------------------------------------------------
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('percent','fixed')),
  value numeric(12,2) not null,
  min_order_amount numeric(12,2) default 0,
  max_uses int,
  used_count int default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  active boolean default true
);

-- ---------------------------------------------------------------------
-- 13. BANNERS  (ໜ້າຫລັກ - slider/promotion)
-- ---------------------------------------------------------------------
create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text,
  image_url text not null,
  link_url text,
  sort_order int default 0,
  active boolean default true
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) - ເປີດໃຊ້ ແລະຕັ້ງ policy ພື້ນຖານ
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;

-- public can read products/categories (storefront)
create policy "public read products" on public.products for select using (status = 'active');
create policy "public read categories" on public.categories for select using (true);

-- users manage only their own rows
create policy "own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

create policy "own addresses" on public.addresses for all using (auth.uid() = user_id);
create policy "own cart" on public.carts for all using (auth.uid() = user_id);
create policy "own cart items" on public.cart_items for all
  using (cart_id in (select id from public.carts where user_id = auth.uid()));

create policy "own orders" on public.orders for select using (auth.uid() = user_id);
create policy "own order items" on public.order_items for select
  using (order_id in (select id from public.orders where user_id = auth.uid()));

create policy "own wishlist" on public.wishlists for all using (auth.uid() = user_id);
create policy "anyone reads reviews" on public.reviews for select using (true);
create policy "own reviews write" on public.reviews for insert with check (auth.uid() = user_id);

-- NOTE: this app's backend uses the Supabase service-role key on the
-- server side (Node/Express), which bypasses RLS. The policies above
-- protect the data if you also expose the Supabase anon key to any
-- client-side code later.
