// Country list shown in signup dropdown (sorted alphabetically, popular ones first)
export const COUNTRIES = [
  // Popular
  { name: "Ghana",            currency: "GH₵" },
  { name: "Nigeria",          currency: "₦"   },
  { name: "Kenya",            currency: "KSh" },
  { name: "South Africa",     currency: "R"   },
  { name: "United States",    currency: "$"   },
  { name: "United Kingdom",   currency: "£"   },
  // Rest of Africa A-Z
  { name: "Benin",            currency: "FCFA" },
  { name: "Botswana",         currency: "P"    },
  { name: "Burkina Faso",     currency: "FCFA" },
  { name: "Cameroon",         currency: "FCFA" },
  { name: "Côte d'Ivoire",    currency: "FCFA" },
  { name: "Egypt",            currency: "E£"   },
  { name: "Ethiopia",         currency: "Br"   },
  { name: "Gambia",           currency: "D"    },
  { name: "Guinea",           currency: "FG"   },
  { name: "Guinea-Bissau",    currency: "FCFA" },
  { name: "Liberia",          currency: "$"    },
  { name: "Mali",             currency: "FCFA" },
  { name: "Mauritania",       currency: "MRU"  },
  { name: "Morocco",          currency: "MAD"  },
  { name: "Mozambique",       currency: "MT"   },
  { name: "Namibia",          currency: "N$"   },
  { name: "Rwanda",           currency: "RWF"  },
  { name: "Senegal",          currency: "FCFA" },
  { name: "Sierra Leone",     currency: "Le"   },
  { name: "Tanzania",         currency: "TSh"  },
  { name: "Togo",             currency: "FCFA" },
  { name: "Uganda",           currency: "USh"  },
  { name: "Zambia",           currency: "ZK"   },
  { name: "Zimbabwe",         currency: "RTGS$"},
  // Other
  { name: "Canada",           currency: "CA$"  },
  { name: "Australia",        currency: "A$"   },
  { name: "Other",            currency: "GH₵"  },
];

// Map a country name (from Nominatim or dropdown) → currency symbol
const CURRENCY_MAP = Object.fromEntries(COUNTRIES.map((c) => [c.name, c.currency]));

export function currencyForCountry(country) {
  return CURRENCY_MAP[country] || "GH₵";
}
