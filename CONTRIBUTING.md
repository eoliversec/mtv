# Contributing

## Adding a country

Edit `data.js` and add an entry to the `COUNTRIES` object:

```js
YourCountry: {
  label: 'Your Country',
  ballistic:  { range: 5000, apogee: 800, ex: 'Missile Name' },
  cruise:     { range: 1500, apogee: 40,  ex: 'Missile Name' },
  boostglide: { range: 2000, apogee: 60,  ex: 'Missile Name' },
},
```

### Fields

| Field    | Type            | Description                              |
|----------|-----------------|------------------------------------------|
| `label`  | string          | Display name                             |
| `range`  | number          | Maximum ground distance in km            |
| `apogee` | number          | Peak altitude in km                      |
| `ex`     | string          | Example weapon system(s)                 |

Set a missile type to `null` if the country does not have that capability.

### Rules

- Use publicly available data only (open-source intelligence)
- Cite your source in the pull request description
- Do not modify `app.js` or `styles.css` unless fixing a bug
- Keep the `ALL` entry up to date if your addition changes the global maximum for any field

## Updating existing data

Same format. Explain what changed and why in your PR.
