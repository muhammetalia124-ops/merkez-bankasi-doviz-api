const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const path = require('path');
const { sequelize, Kur, initializeDatabase } = require('./model');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const TCMB_URL = 'https://www.tcmb.gov.tr/kurlar/today.xml';

async function saveKurlar(tarih, kurlar) {
    if (!Array.isArray(kurlar) || kurlar.length === 0) {
        return;
    }

    for (const item of kurlar) {
        await Kur.findOrCreate({
            where: { tarih, kod: item.kod },
            defaults: {
                tarih,
                kod: item.kod,
                isim: item.isim,
                dovizAlis: item.dovizAlis,
                dovizSatis: item.dovizSatis,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
    }
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.get('/ping', (req, res) => {
    res.status(200).send('Uyan yeğen sabah oldu');
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

        xml2js.parseString(xmlData, { explicitArray: false }, async (err, result) => {
            if (err || !result || !result.Tarih_Date) {
                return res.status(500).json({ hata: 'Merkez Bankası verisi okunamadı.' });
            }

            const items = Array.isArray(result.Tarih_Date.Currency)
                ? result.Tarih_Date.Currency
                : [result.Tarih_Date.Currency].filter(Boolean);

            const kurlar = items.map((item) => ({
                kod: item.$.CurrencyCode,
                isim: item.Isim || '',
                dovizAlis: item.ForexBuying ? String(item.ForexBuying).trim() : null,
                dovizSatis: item.ForexSelling ? String(item.ForexSelling).trim() : null
            }));

            const tarih = result.Tarih_Date.$.Tarih;

            try {
                await saveKurlar(tarih, kurlar);
                console.log('=> Kurlar veri tabanına kaydedildi.');
            } catch (saveErr) {
                console.error('Veritabanı kaydı sırasında hata:', saveErr.message);
            }

            res.json({
                tarih,
                kurlar
            });
        });
    } catch (error) {
        console.error('TCMB verisi alınamadı:', error.message);
        res.status(500).json({ hata: 'Merkez Bankası verisi alınamadı.' });
    }
});

app.get('/api/kurlar', async (req, res) => {
    try {
        const latestDate = await Kur.max('tarih');

        if (!latestDate) {
            return res.json([]);
        }

        const rows = await Kur.findAll({
            where: { tarih: latestDate },
            order: [['isim', 'ASC']]
        });

        res.json(rows.map((row) => row.toJSON()));
    } catch (error) {
        res.status(500).json({ hata: 'Kurlar çekilemedi.' });
    }
});

app.post('/api/kurlar', async (req, res) => {
    try {
        const { tarih, kod, isim, dovizAlis, dovizSatis } = req.body;

        await Kur.create({
            tarih,
            kod,
            isim,
            dovizAlis,
            dovizSatis,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        res.send('Kur eklendi');
    } catch (error) {
        res.status(500).send('Kur eklenemedi');
    }
});

app.put('/api/kurlar/:id', async (req, res) => {
    try {
        const { dovizAlis, dovizSatis } = req.body;

        await Kur.update(
            { dovizAlis, dovizSatis, updatedAt: new Date() },
            { where: { id: req.params.id } }
        );

        res.send('Kur güncellendi');
    } catch (error) {
        res.status(500).send('Kur güncellenemedi');
    }
});

app.delete('/api/kurlar/:id', async (req, res) => {
    try {
        await Kur.destroy({ where: { id: req.params.id } });
        res.send('Kur silindi');
    } catch (error) {
        res.status(500).send('Kur silinemedi');
    }
});

initializeDatabase().then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`API hazır. http://localhost:${port}/doviz`);
    });
});