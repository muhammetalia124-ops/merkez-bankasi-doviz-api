const API_URL = "/doviz";
const DB_URL = "/api/kurlar";

const currencySelect = document.getElementById("currency-select");
const buyingRate = document.getElementById("buying-rate");
const sellingRate = document.getElementById("selling-rate");

let currencies = [];

function renderCurrencyOptions() {
    currencySelect.innerHTML = '<option value="">Döviz seçin</option>';

    currencies.forEach(function (currency) {
        const option = document.createElement("option");
        option.value = currency.kod;
        option.textContent = currency.kod + " - " + currency.isim;
        currencySelect.appendChild(option);
    });
}

async function loadFromDb() {
    try {
        const response = await fetch(DB_URL);
        if (!response.ok) {
            return [];
        }

        const rows = await response.json();
        if (!Array.isArray(rows) || rows.length === 0) {
            return [];
        }

        return rows.map(function (row) {
            return {
                kod: row.kod,
                isim: row.isim,
                dovizAlis: row.dovizAlis,
                dovizSatis: row.dovizSatis,
                tarih: row.tarih
            };
        });
    } catch (error) {
        console.warn("Veritabanı okunamadı:", error);
        return [];
    }
}

async function getCurrencies() {
    const dbCurrencies = await loadFromDb();

    if (dbCurrencies.length > 0) {
        currencies = dbCurrencies;
        renderCurrencyOptions();
    }

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("API bağlantısı başarısız.");
        }

        const data = await response.json();
        currencies = data.kurlar || [];
        renderCurrencyOptions();
    } catch (error) {
        console.warn("Merkez Bankası erişilemedi, veritabanı verisi kullanılacak:", error);

        if (currencies.length === 0) {
            currencies = dbCurrencies;
            renderCurrencyOptions();
        }
    }
}

currencySelect.addEventListener("change", function () {
    const selectedCode = this.value;
    const selectedCurrency = currencies.find(function (currency) {
        return currency.kod === selectedCode;
    });

    if (!selectedCurrency) {
        buyingRate.textContent = "-";
        sellingRate.textContent = "-";
        return;
    }

    buyingRate.textContent = selectedCurrency.dovizAlis
        ? selectedCurrency.dovizAlis + " ₺"
        : "Veri yok";

    sellingRate.textContent = selectedCurrency.dovizSatis
        ? selectedCurrency.dovizSatis + " ₺"
        : "Veri yok";
});

getCurrencies();

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
    document.body.classList.add("light-theme");
}

window.addEventListener("storage", function (event) {
    if (event.key === "theme") {
        if (event.newValue === "light") {
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.remove("light-theme");
        }
    }
});
