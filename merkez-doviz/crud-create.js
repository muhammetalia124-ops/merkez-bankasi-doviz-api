const { Kur, initializeDatabase } = require('./model');

(async () => {
  try {
    await initializeDatabase();

    const yeni = await Kur.create({
      tarih: '2026-09-28',
      kod: 'USD',
      isim: 'ABD DOLARI',
      dovizAlis: '48.90',
      dovizSatis: '48.98'
    });

    console.log('Eklendi:', yeni.toJSON());
  } catch (err) {
    console.error('Hata:', err.message);
  }
})();
