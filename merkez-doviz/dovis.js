const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';


const connectionString = path.join(__dirname, 'kurlar.db');
const db = new sqlite3.Database(connectionString, (err) => {
    if (!err) {
        db.run('CREATE TABLE IF NOT EXISTS Kurlar (id INTEGER PRIMARY KEY AUTOINCREMENT, tarih TEXT, kod TEXT, isim TEXT, dovizAlis TEXT, dovizSatis TEXT)');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/doviz', async (req, res) => {
    try {
        const response = await axios.get(TCMB_URL, {
            responseType: 'text',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/xml, text/xml, */*'
            }
        });

        const xmlData = typeof response.data === 'string' ? response.data : String(response.data || '');

        xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
            if (err || !result || !result.Tarih_Date) {
                return res.status(500).json({ hata: 'Merkez Bankası verisi okunamadı.' });
            }

            const currencyItems = Array.isArray(result.Tarih_Date.Currency)
                ? result.Tarih_Date.Currency
                : [result.Tarih_Date.Currency].filter(Boolean);

            const kurlar = currencyItems.map(item => ({
                kod: item.$.CurrencyCode,
                isim: item.Isim || '',
                dovizAlis: item.ForexBuying ? String(item.ForexBuying).trim() : null,
                dovizSatis: item.ForexSelling ? String(item.ForexSelling).trim() : null
            }));

            const veriTarihi = result.Tarih_Date.$.Tarih;

            db.get('SELECT id FROM Kurlar WHERE tarih = ? LIMIT 1', [veriTarihi], (err, row) => {
                if (!row) {
                    const stmt = db.prepare('INSERT INTO Kurlar (tarih, kod, isim, dovizAlis, dovizSatis) VALUES (?, ?, ?, ?, ?)');
                    kurlar.forEach(item => {
                        stmt.run(veriTarihi, item.kod, item.isim, item.dovizAlis, item.dovizSatis);
                    });
                    stmt.finalize();
                    console.log('=> Kurlar veri tabanına yedeklendi!');
                } else {
                    console.log('=> Kurlar veri tabanında zaten mevcut.');
                }
            });

            res.json({
                tarih: veriTarihi,
                kurlar: kurlar
            });
        });
    } catch (error) {
        res.status(500).json({ hata: 'Merkez Bankası verisi alınamadı.' });
    }
});
app.get('/api/kurlar', (req, res) => {
    db.all('SELECT * FROM Kurlar', (err, rows) => {
        res.json(rows);
    });
});

app.post('/api/kurlar', (req, res) => {
    const { tarih, kod, isim, dovizAlis, dovizSatis } = req.body;
    db.run('INSERT INTO Kurlar (tarih, kod, isim, dovizAlis, dovizSatis) VALUES (?, ?, ?, ?, ?)', [tarih, kod, isim, dovizAlis, dovizSatis], () => {
        res.send("Kur eklendi");
    });
});

app.put('/api/kurlar/:id', (req, res) => {
    const { dovizAlis, dovizSatis } = req.body;
    db.run('UPDATE Kurlar SET dovizAlis = ?, dovizSatis = ? WHERE id = ?', [dovizAlis, dovizSatis, req.params.id], () => {
        res.send("Kur güncellendi");
    });
});

app.delete('/api/kurlar/:id', (req, res) => {
    db.run('DELETE FROM Kurlar WHERE id = ?', [req.params.id], () => {
        res.send("Kur silindi");
    });
});
app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Servisiniz hazır! http://localhost:${PORT}/doviz adresinden test edebilirsiniz.`);
});