# Technology Stack & Build System

## Core Technologies

- **TypeScript**: Primary language with strict type checking and ES2015+ target
- **WebRTC**: Real-time communication foundation
- **Node.js**: Runtime environment (18+ required, 20 recommended)
- **npm**: Package management (8.6.0+ required)

## Build System

- **TypeScript Compiler**: Multi-project build with project references
- **Custom Build Scripts**: Automated barrel exports, version generation, and protocol compilation
- **ESLint**: Code style enforcement with TypeScript-specific rules
- **Prettier**: Code formatting with specific configuration

## Key Dependencies

- **AWS SDK**: `@aws-sdk/client-chime-sdk-messaging` for messaging services
- **Crypto**: `@aws-crypto/sha256-js` for authentication
- **Compression**: `pako` for data compression
- **Protocol Buffers**: `protobufjs` for signaling protocol
- **Browser Detection**: `detect-browser` and `ua-parser-js`

## Common Commands

```bash
# Development
npm run build          # Full build with type checking and docs
npm run tsc:watch      # Watch mode for development
npm run lint           # ESLint with auto-fix
npm run check          # Code style validation

# Testing
npm run test           # Run unit tests with coverage
npm run test:fast      # Quick test run
npm run test:retry     # Retry failed tests (CI)

# Documentation
npm run doc            # Generate TypeScript API docs
npm run build:release  # Full release build with all checks

# Demos
cd demos/browser && npm run start     # Local browser demo
cd demos/serverless && npm run deploy # Serverless deployment
```

## Build Process

1. **Barrelize**: Auto-generates `src/index.ts` with all exports
2. **Version Generation**: Creates version metadata from git and package.json
3. **Protocol Compilation**: Generates TypeScript from Protocol Buffer definitions
4. **TypeScript Compilation**: Builds source and guides with project references
5. **Asset Copying**: Copies protocol files to build directory

## Testing Framework

- **Mocha**: Test runner with async support
- **Chai**: Assertion library with promises support
- **Sinon**: Mocking and stubbing
- **NYC**: Code coverage reporting (100% coverage required)
- **Cross-env**: Environment variable management