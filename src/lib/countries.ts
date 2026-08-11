export type Country = {
  code: string;
  name: string;
  /** Популярные направления для туруслуг — выше в пустом списке */
  popular?: boolean;
  blocked?: boolean;
};

export const COUNTRIES: Country[] = [
  { code: "AU", name: "Австралия" },
  { code: "AT", name: "Австрия", popular: true },
  { code: "AZ", name: "Азербайджан" },
  { code: "AL", name: "Албания" },
  { code: "DZ", name: "Алжир" },
  { code: "AO", name: "Ангола" },
  { code: "AD", name: "Андорра" },
  { code: "AG", name: "Антигуа и Барбуда" },
  { code: "AR", name: "Аргентина" },
  { code: "AM", name: "Армения" },
  { code: "AF", name: "Афганистан" },
  { code: "BS", name: "Багамы" },
  { code: "BD", name: "Бангладеш" },
  { code: "BB", name: "Барбадос" },
  { code: "BH", name: "Бахрейн", popular: true },
  { code: "BY", name: "Беларусь" },
  { code: "BZ", name: "Белиз" },
  { code: "BE", name: "Бельгия" },
  { code: "BJ", name: "Бенин" },
  { code: "BG", name: "Болгария", popular: true },
  { code: "BO", name: "Боливия" },
  { code: "BA", name: "Босния и Герцеговина" },
  { code: "BW", name: "Ботсвана" },
  { code: "BR", name: "Бразилия" },
  { code: "BN", name: "Бруней" },
  { code: "BF", name: "Буркина-Фасо" },
  { code: "BI", name: "Бурунди" },
  { code: "BT", name: "Бутан" },
  { code: "VU", name: "Вануату" },
  { code: "GB", name: "Великобритания", popular: true },
  { code: "HU", name: "Венгрия", popular: true },
  { code: "VE", name: "Венесуэла" },
  { code: "VN", name: "Вьетнам", popular: true },
  { code: "GA", name: "Габон" },
  { code: "HT", name: "Гаити" },
  { code: "GY", name: "Гайана" },
  { code: "GM", name: "Гамбия" },
  { code: "GH", name: "Гана" },
  { code: "GT", name: "Гватемала" },
  { code: "GN", name: "Гвинея" },
  { code: "DE", name: "Германия", popular: true },
  { code: "HN", name: "Гондурас" },
  { code: "HK", name: "Гонконг", blocked: true },
  { code: "GD", name: "Гренада" },
  { code: "GR", name: "Греция", popular: true },
  { code: "GE", name: "Грузия", popular: true },
  { code: "DK", name: "Дания" },
  { code: "DJ", name: "Джибути" },
  { code: "DM", name: "Доминика" },
  { code: "DO", name: "Доминиканская Республика", popular: true },
  { code: "EG", name: "Египет", popular: true },
  { code: "ZM", name: "Замбия" },
  { code: "ZW", name: "Зимбабве" },
  { code: "IL", name: "Израиль", popular: true },
  { code: "IN", name: "Индия", popular: true },
  { code: "ID", name: "Индонезия", popular: true },
  { code: "JO", name: "Иордания", popular: true },
  { code: "IQ", name: "Ирак" },
  { code: "IR", name: "Иран" },
  { code: "IE", name: "Ирландия" },
  { code: "IS", name: "Исландия" },
  { code: "ES", name: "Испания", popular: true },
  { code: "IT", name: "Италия", popular: true },
  { code: "YE", name: "Йемен" },
  { code: "CV", name: "Кабо-Верде" },
  { code: "KZ", name: "Казахстан", popular: true },
  { code: "KH", name: "Камбоджа", popular: true },
  { code: "CM", name: "Камерун" },
  { code: "CA", name: "Канада" },
  { code: "QA", name: "Катар", popular: true },
  { code: "KE", name: "Кения", popular: true },
  { code: "CY", name: "Кипр", popular: true },
  { code: "KG", name: "Киргизия" },
  { code: "CN", name: "Китай", popular: true },
  { code: "CO", name: "Колумбия" },
  { code: "CR", name: "Коста-Рика" },
  { code: "CI", name: "Кот-д’Ивуар" },
  { code: "CU", name: "Куба", popular: true },
  { code: "KW", name: "Кувейт" },
  { code: "LA", name: "Лаос" },
  { code: "LV", name: "Латвия" },
  { code: "LS", name: "Лесото" },
  { code: "LR", name: "Либерия" },
  { code: "LB", name: "Ливан" },
  { code: "LY", name: "Ливия" },
  { code: "LT", name: "Литва" },
  { code: "LI", name: "Лихтенштейн" },
  { code: "LU", name: "Люксембург" },
  { code: "MU", name: "Маврикий", popular: true },
  { code: "MG", name: "Мадагаскар" },
  { code: "MO", name: "Макао" },
  { code: "MW", name: "Малави" },
  { code: "MY", name: "Малайзия", popular: true },
  { code: "MV", name: "Мальдивы", popular: true },
  { code: "MT", name: "Мальта" },
  { code: "MA", name: "Марокко", popular: true },
  { code: "MX", name: "Мексика", popular: true },
  { code: "MZ", name: "Мозамбик" },
  { code: "MD", name: "Молдова" },
  { code: "MC", name: "Монако" },
  { code: "MN", name: "Монголия" },
  { code: "MM", name: "Мьянма" },
  { code: "NA", name: "Намибия" },
  { code: "NP", name: "Непал" },
  { code: "NE", name: "Нигер" },
  { code: "NG", name: "Нигерия" },
  { code: "NL", name: "Нидерланды" },
  { code: "NI", name: "Никарагуа" },
  { code: "NZ", name: "Новая Зеландия" },
  { code: "NO", name: "Норвегия" },
  { code: "AE", name: "ОАЭ", popular: true },
  { code: "OM", name: "Оман", popular: true },
  { code: "PK", name: "Пакистан" },
  { code: "PA", name: "Панама" },
  { code: "PY", name: "Парагвай" },
  { code: "PE", name: "Перу" },
  { code: "PL", name: "Польша" },
  { code: "PT", name: "Португалия", popular: true },
  { code: "RW", name: "Руанда" },
  { code: "RO", name: "Румыния" },
  { code: "SV", name: "Сальвадор" },
  { code: "SA", name: "Саудовская Аравия" },
  { code: "SC", name: "Сейшелы", popular: true },
  { code: "SN", name: "Сенегал" },
  { code: "RS", name: "Сербия" },
  { code: "SG", name: "Сингапур", popular: true },
  { code: "SY", name: "Сирия" },
  { code: "SK", name: "Словакия" },
  { code: "SI", name: "Словения" },
  { code: "US", name: "США", popular: true },
  { code: "TJ", name: "Таджикистан" },
  { code: "TH", name: "Таиланд", popular: true },
  { code: "TW", name: "Тайвань" },
  { code: "TZ", name: "Танзания", popular: true },
  { code: "TG", name: "Того" },
  { code: "TT", name: "Тринидад и Тобаго" },
  { code: "TN", name: "Тунис", popular: true },
  { code: "TM", name: "Туркменистан" },
  { code: "TR", name: "Турция", popular: true },
  { code: "UG", name: "Уганда" },
  { code: "UZ", name: "Узбекистан", popular: true },
  { code: "UA", name: "Украина" },
  { code: "UY", name: "Уругвай" },
  { code: "FJ", name: "Фиджи" },
  { code: "PH", name: "Филиппины", popular: true },
  { code: "FI", name: "Финляндия" },
  { code: "FR", name: "Франция", popular: true },
  { code: "HR", name: "Хорватия", popular: true },
  { code: "ME", name: "Черногория", popular: true },
  { code: "CZ", name: "Чехия", popular: true },
  { code: "CL", name: "Чили" },
  { code: "CH", name: "Швейцария", popular: true },
  { code: "SE", name: "Швеция" },
  { code: "LK", name: "Шри-Ланка", popular: true },
  { code: "EC", name: "Эквадор" },
  { code: "EE", name: "Эстония" },
  { code: "ET", name: "Эфиопия" },
  { code: "ZA", name: "ЮАР", popular: true },
  { code: "KR", name: "Южная Корея", popular: true },
  { code: "JM", name: "Ямайка" },
  { code: "JP", name: "Япония", popular: true },
];

export function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase("ru-RU");
}

export function filterCountries(query: string, limit = 8): Country[] {
  const q = normalizeSearch(query);

  if (!q) {
    return COUNTRIES.filter((c) => c.popular && !c.blocked).slice(0, limit);
  }

  const starts: Country[] = [];
  const includes: Country[] = [];

  for (const country of COUNTRIES) {
    const name = normalizeSearch(country.name);
    const code = country.code.toLowerCase();
    if (name.startsWith(q) || code === q) {
      starts.push(country);
    } else if (name.includes(q) || code.includes(q)) {
      includes.push(country);
    }
  }

  return [...starts, ...includes].slice(0, limit);
}

export function findCountryByName(name: string): Country | undefined {
  const q = normalizeSearch(name);
  return COUNTRIES.find((c) => normalizeSearch(c.name) === q);
}
