require('dotenv').config();
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const { attachUser } = require('./middleware/auth');

// ---- ຕາໜ່າງປອດໄພ: ຖ້າມີ error ທີ່ບໍ່ໄດ້ຈັບໄວ້ (bug) ໃນບ່ອນໃດບ່ອນໜຶ່ງ,
// ໃຫ້ log ໄວ້ເທົ່ານັ້ນ ບໍ່ໃຫ້ server ທັງໝົດຄ້າງ/ດັບໄປໝົດ (ຄືເຫດການ checkout ຄັ້ງກ່ອນ)
process.on('unhandledRejection', (err) => {
  console.error('⚠️ Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
});

const app = express();

// ---- View engine ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// ---- Middleware ----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'lynn-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 ວັນ
}));

app.use(attachUser);

// ---- Routes ----
app.use('/', require('./routes/products'));
app.use('/auth', require('./routes/auth'));
app.use('/cart', require('./routes/cart'));
app.use('/orders', require('./routes/orders'));
app.use('/admin', require('./routes/admin'));

// ---- 404 ----
app.use((req, res) => {
  res.status(404).render('error', { title: 'ບໍ່ພົບໜ້ານີ້', message: 'ບໍ່ພົບໜ້າທີ່ທ່ານຊອກຫາ (404)' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🌿 Lynn shop running on http://localhost:${PORT}`));
