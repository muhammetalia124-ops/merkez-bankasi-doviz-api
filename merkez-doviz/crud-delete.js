const { Kur, initializeDatabase } = require('./model');

(async () => {
  try {
    await initializeDatabase();

    const deleted = await Kur.destroy({ where: { tarih: '2026-09-28', kod: 'USD' } });
    console.log('Silinen kayıt sayısı:', deleted);
  } catch (err) {
    console.error('Hata:', err.message);
  }
})();
