# Standard Node.js Testing Setup

A minimal Node.js project template for testing and experimenting with packages.

## Setup

```bash
# Clone the repository (if applicable)
git clone [repository-url]
cd mecha

# Install dependencies
npm install
```

## Adding Packages

```bash
# Add a production dependency
npm install package-name

# Add a development dependency
npm install --save-dev package-name
```

## Scripts

- `npm start` - Run the application
- `npm run dev` - Run the application with nodemon for development (auto-reload)
- `npm test` - Run tests
- `npm run lint` - Run linting

## Project Structure

```
.
├── src/             # Source code
│   └── index.js     # Entry point
├── test/            # Test files
│   └── index.test.js
├── package.json     # Project configuration
├── .gitignore       # Git ignore rules
└── README.md        # Project documentation
```

## Testing New Packages

1. Install the package: `npm install package-name`
2. Import it in your code:
   ```javascript
   const packageName = require('package-name');
   // or
   import packageName from 'package-name';
   ```
3. Use the package in `src/index.js` or create a new file
4. Run your code: `npm start` or `npm run dev` 