# Project Structure & Organization

## Root Directory Layout

```
├── src/                    # Main source code
├── test/                   # Unit tests (mirrors src structure)
├── demos/                  # Example applications
├── guides/                 # Developer documentation
├── docs/                   # Generated API documentation
├── build/                  # Compiled output
├── config/                 # Build configuration
├── script/                 # Build and utility scripts
├── libs/                   # External libraries (Voice Focus)
├── protocol/               # Protocol Buffer definitions
└── integration/            # Integration tests
```

## Source Code Architecture

### Core Pattern: One Class Per File
- Each TypeScript file typically contains one main class/interface
- File names match the class name exactly
- Barrel exports auto-generated in `src/index.ts`

### Domain-Driven Structure
```
src/
├── audiovideocontroller/   # Main meeting controller
├── devicecontroller/       # Audio/video device management
├── realtimecontroller/     # Real-time communication
├── videotilecontroller/    # Video tile management
├── contentsharecontroller/ # Screen/content sharing
├── messagingsession/       # Messaging functionality
├── meetingsession/         # Meeting session management
├── backgroundblurprocessor/ # AI background effects
├── voicefocus/            # Noise reduction
├── task/                  # Async task management
├── logger/                # Logging infrastructure
├── utils/                 # Utility functions
└── index.ts               # Auto-generated barrel exports
```

## Key Architectural Patterns

### Observer Pattern
- Extensive use of observer interfaces for event handling
- `AudioVideoObserver`, `DeviceChangeObserver`, `ContentShareObserver`
- Clean separation between core logic and UI updates

### Facade Pattern
- `AudioVideoFacade` provides simplified API surface
- `DefaultAudioVideoFacade` implements complex orchestration
- Hides internal complexity from consumers

### Factory Pattern
- `DefaultMeetingSession` factory for session creation
- `MediaDeviceFactory` for device abstraction
- `VideoTileFactory` for video tile management

### Task-Based Architecture
- All async operations implemented as `Task` objects
- `SerialGroupTask` and `ParallelGroupTask` for orchestration
- Cancellable and retryable operations

## Testing Structure

### Test Organization
- Tests mirror `src/` directory structure exactly
- Mock objects in dedicated folders (`dommock/`, `transformdevicemock/`)
- Shared test utilities in `test/utils.ts`

### Coverage Requirements
- 100% code coverage enforced
- Branch, line, function, and statement coverage
- NYC configuration in `package.json`

## Configuration Management

### TypeScript Configuration
- `config/tsconfig.base.json` - Base configuration
- `config/tsconfig.json` - Main build configuration  
- `test/tsconfig.json` - Test-specific configuration
- Project references for incremental builds

### Build Scripts
- `script/barrelize.js` - Auto-generates exports
- `script/generate-version.js` - Version metadata
- `script/copy-protocol.js` - Protocol buffer handling

## Demo Applications

### Browser Demos (`demos/browser/`)
- `meetingV2` - Full-featured video conferencing
- `meetingReadinessChecker` - Network/device testing
- `messagingSession` - Real-time messaging

### Serverless Deployment (`demos/serverless/`)
- AWS SAM templates for cloud deployment
- Lambda functions for meeting management
- CloudFormation infrastructure as code

## Documentation Structure

### Developer Guides (`guides/`)
- Numbered guides (01-21) covering major features
- TypeScript source files compiled to documentation
- Media assets and examples

### API Documentation (`docs/`)
- Auto-generated from TypeScript comments
- TypeDoc-based HTML documentation
- Class, interface, and module references