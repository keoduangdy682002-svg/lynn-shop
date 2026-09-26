const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Client ຫລັກ - ໃຊ້ service_role key, ສຳລັບ query ຖານຂໍ້ມູນທັງໝົດ (ບາຍພາດ RLS)
// ຫ້າມເອີ້ນ .auth.signInWithPassword() ຜ່ານໂຕນີ້ ເພາະຈະເຮັດໃຫ້ header ຖືກສະຫລັບ
// ໄປໃຊ້ສິດຂອງຜູ້ໃຊ້ທຳມະດາແທນ service_role ສຳລັບ request ຕໍ່ໆໄປ
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Client ແຍກຕ່າງຫາກ - ໃຊ້ anon key, ສຳລັບກວດ email/password ຕອນ login ເທົ່ານັ້ນ
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

module.exports = supabase;
module.exports.authClient = supabaseAuth;
