const { Kur, initializeDatabase } = require('./model');

(async () => {
  try {
    await initializeDatabase();

    const updated = await Kur.update(
      { dovizAlis: '49.10', dovizSatis: '49.30' },
      { where: { tarih: '2026-09-28', kod: 'USD' } }
    );

    console.log('Güncellendi:', updated);
  } catch (err) {
    console.error('Hata:', err.message);
  }
})();
