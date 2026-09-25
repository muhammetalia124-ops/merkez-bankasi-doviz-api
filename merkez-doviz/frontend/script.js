const API_URL = "/doviz";

const currencySelect = document.getElementById("currency-select");
const buyingRate = document.getElementById("buying-rate");
const sellingRate = document.getElementById("selling-rate");

let currencies = [];

async function getCurrencies() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("API bağlantısı başarısız.");
        }

        const data = await response.json();

        currencies = data.kurlar;

        currencies.forEach(currency => {
            const option = document.createElement("option");

            option.value = currency.kod;
            option.textContent = `${currency.kod} - ${currency.isim}`;

            currencySelect.appendChild(option);
        });

    } catch (error) {
        console.error("Hata:", error);
    }
}

currencySelect.addEventListener("change", function () {
    const selectedCode = this.value;

    const selectedCurrency = currencies.find(
        currency => currency.kod === selectedCode
    );

    if (!selectedCurrency) {
        buyingRate.textContent = "-";
        sellingRate.textContent = "-";
        return;
    }

    buyingRate.textContent = selectedCurrency.dovizAlis
        ? `${selectedCurrency.dovizAlis} ₺`
        : "Veri yok";

    sellingRate.textContent = selectedCurrency.dovizSatis
        ? `${selectedCurrency.dovizSatis} ₺`
        : "Veri yok";
});

getCurrencies();

/* Landing page ile aynı temayı kullanır */

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
    document.body.classList.add("light-theme");
}

/* Landing page açıkken tema değiştirilirse günceller */

window.addEventListener("storage", function (event) {
    if (event.key === "theme") {
        if (event.newValue === "light") {
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.remove("light-theme");
        }
    }
});