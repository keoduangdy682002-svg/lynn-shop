// ---- Toast ແຈ້ງເຕືອນ (ໃຊ້ໄດ້ຈາກທຸກໜ້າ, ບໍ່ຕ້ອງ reload) ----
function showToast(type, message) {
  document.querySelectorAll('.toast').forEach(t => t.remove()); // ລຶບ toast ເກົ່າ (ຖ້າມີ) ກ່ອນ
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : '⚠️'}</span>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" aria-label="close">&times;</button>
  `;
  el.querySelector('.toast-close').onclick = () => el.remove();
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-hide');
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

// ---- ເພີ່ມສິນຄ້າໃສ່ກະຕ່າ ໂດຍບໍ່ເດັ້ງໜ້າ (AJAX) ----
document.addEventListener('DOMContentLoaded', () => {
  const addForm = document.getElementById('addToCartForm');
  if (!addForm) return;

  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = addForm.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'ກຳລັງເພີ່ມ...';

    try {
      const res = await fetch('/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams(new FormData(addForm))
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', data.message);
        const badge = document.getElementById('cartBadge');
        if (badge) badge.textContent = data.cartCount;
      } else if (data.requiresAuth) {
        showToast('error', data.message);
        setTimeout(() => { window.location.href = '/auth/register'; }, 1600);
      } else {
        showToast('error', data.message || 'ເພີ່ມສິນຄ້າບໍ່ສຳເລັດ');
      }
    } catch (err) {
      showToast('error', 'ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
});
