const { Kur, initializeDatabase } = require('./model');

(async () => {
  try {
    await initializeDatabase();

    const rows = await Kur.findAll();
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Hata:', err.message);
  }
})();
