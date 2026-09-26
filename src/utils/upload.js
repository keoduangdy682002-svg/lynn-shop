const multer = require('multer');
const supabase = require('../config/supabaseClient');

const BUCKET = 'lynn-uploads';

// ເກັບໄຟລ໌ໄວ້ໃນ memory ຊົ່ວຄາວ (ບໍ່ຂຽນລົງ disk) ກ່ອນສົ່ງຕໍ່ໄປ Supabase Storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // ຈຳກັດ 5MB ຕໍ່ໄຟລ໌
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('ອະນຸຍາດແຕ່ໄຟລ໌ຮູບພາບເທົ່ານັ້ນ (jpg, png, webp, ...)'));
    }
    cb(null, true);
  }
});

/**
 * ອັບໂຫລດໄຟລ໌ (buffer) ຂຶ້ນ Supabase Storage ແລ້ວສົ່ງຄືນ public URL
 * @param {Express.Multer.File} file - ໄຟລ໌ຈາກ multer (req.file)
 * @param {string} folder - ໂຟນເດີຍ່ອຍໃນ bucket ເຊັ່ນ 'products', 'shipping-proof'
 * @returns {Promise<string>} public URL ຂອງຮູບ
 */
async function uploadFile(file, folder = 'misc') {
  if (!file) return null;
  const ext = file.originalname.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: false });

  if (error) throw new Error(`ອັບໂຫລດຮູບບໍ່ສຳເລັດ: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

module.exports = { upload, uploadFile };
