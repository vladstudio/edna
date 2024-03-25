import { startTimer } from "./util";

async function getCurrencyData() {
  // currencyData = JSON.parse(cachedCurrencies)
  let durFn = startTimer();
  const response = await fetch("/api/currency_rates.json", {
    cache: "no-cache",
  });
  let s = await response.text();
  // console.log(`currencyData: '${s}'`)
  let res = JSON.parse(s);
  // console.log("currencyData:", currencyData)
  console.log("got currency data in ", durFn(), "ms");
  return res;
}

let currenciesLoaded = false;
function loadCurrencies() {
  function onCurrenciesLoaded(data) {
    // @ts-ignore
    let math = window.math;
    let base = data.base_code || data.base;
    if (!currenciesLoaded) {
      math.createUnit(base, {
        override: currenciesLoaded,
        aliases: [base.toLowerCase()],
      });
    }

    Object.keys(data.rates)
      .filter(function (currency) {
        return currency !== base;
      })
      .forEach(function (currency) {
        math.createUnit(
          currency,
          {
            definition: math.unit(1 / data.rates[currency], base),
            aliases: currency === "CUP" ? [] : [currency.toLowerCase()], // Lowercase CUP clashes with the measurement unit cup
          },
          { override: currenciesLoaded }
        );
      });
    currenciesLoaded = true;
    window.document.dispatchEvent(new Event("currenciesLoaded"));
  }

  getCurrencyData()
    .then((data) => {
      onCurrenciesLoaded(data);
    })
    .catch((e) => {
      console.log("error getting currency data:", e);
      return;
    });
}

export function startLoadCurrencies() {
  loadCurrencies();
  setInterval(loadCurrencies, 1000 * 3600 * 4);
}
