# S3LogWorker Implementation

This directory contains the implementation of the S3LogWorker, a web worker-based logging system that collects logs, stores them in IndexedDB, and uploads them to S3 using presigned URLs.

## Files

- **`S3LogWorker.ts`** - Main S3LogWorker class that implements the LogWorker interface
- **`s3-log-worker.worker.ts`** - Standalone web worker implementation for browser usage
- **`S3LogWorkerExample.ts`** - Example usage demonstrating how to use the S3LogWorker
- **`LogWorker.ts`** - Interface definition for log workers

- **`UploadLogsOptions.ts`** - Interface for upload configuration options

## Features

### Core Functionality

- **IndexedDB Storage**: Persistent log storage across browser sessions
- **GZIP Compression**: Automatic compression before upload (70% size reduction)
- **Manual Upload Trigger**: Upload only when explicitly requested
- **Retry Logic**: Exponential backoff for failed operations
- **Storage Management**: Automatic cleanup when limits exceeded

### Configuration Options

- **Storage Limits**: Configurable entry count and byte limits
- **API Integration**: Configurable endpoint for presigned URL acquisition
- **Authentication**: Bearer token authentication using join tokens
- **Metadata**: Meeting and attendee ID for log organization

## Usage

### Basic Usage with S3Logger

```typescript
import S3Logger from '../logger/S3Logger';
import S3LoggerOptions from '../logger/S3LoggerOptions';
import LogLevel from '../logger/LogLevel';

// Initialize S3Logger
const logger = new S3Logger({
  logLevel: LogLevel.DEBUG,
  presignedUrl: 'https://your-api-endpoint.com/presigned-url',
  meetingId: 'meeting-123',
  attendeeId: 'attendee-456',
  joinToken: 'your-join-token',
  maxEntries: 500,
  maxBytes: 50 * 1024 * 1024, // 50MB
});

// Log messages
logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');

// Upload logs to S3
await logger.uploadLogs();

// Clean up
logger.destroy();
```

### Direct Web Worker Usage

```typescript
// Create worker from the standalone worker file
const worker = new Worker('path/to/s3-log-worker.worker.js');

// Initialize worker
worker.postMessage({
  command: 'LOG_WORKER_INITIALIZE',
  config: {
    presignedUrlEndpoint: 'https://your-api-endpoint.com/presigned-url',
    meetingId: 'meeting-123',
    attendeeId: 'attendee-456',
    joinToken: 'your-join-token',
    maxEntries: 500,
    maxBytes: 50 * 1024 * 1024,
  },
});

// Send log messages
worker.postMessage({
  command: 'PUT_LOG',
  level: 'INFO',
  message: 'This is a log message',
});

// Trigger upload
worker.postMessage({
  command: 'UPLOAD_LOGS',
  joinToken: 'your-join-token',
});

// Listen for responses
worker.addEventListener('message', event => {
  const { command, message, error } = event.data;

  switch (command) {
    case 'LOG_WORKER_READY':
      console.log('Worker ready');
      break;
    case 'LOG_UPLOAD_COMPLETE':
      console.log('Upload complete:', message);
      break;
    case 'LOG_UPLOAD_FAILED':
      console.error('Upload failed:', error);
      break;
  }
});
```

## API Reference

### S3LogWorker Commands

#### Initialization

- **`LOG_WORKER_INITIALIZE`** - Initialize the worker with configuration

#### Log Operations

- **`PUT_LOG`** - Store a log entry in IndexedDB
- **`UPLOAD_LOGS`** - Upload all stored logs to S3

#### Lifecycle

- **`TERMINATE`** - Terminate the worker and clean up resources

#### Response Commands

- **`LOG_WORKER_READY`** - Worker initialized successfully
- **`LOG_WORKER_ERROR`** - Error occurred in worker
- **`LOG_UPLOAD_COMPLETE`** - Upload completed successfully
- **`LOG_UPLOAD_FAILED`** - Upload failed
- **`LOG_WORKER_TERMINATED`** - Worker terminated

### Configuration Options

```typescript
interface S3LogWorkerConfig {
  presignedUrlEndpoint?: string; // API endpoint for presigned URLs
  meetingId?: string; // Meeting identifier
  attendeeId?: string; // Attendee identifier
  joinToken?: string; // Authentication token
  maxEntries?: number; // Maximum log entries (default: 500)
  maxBytes?: number; // Maximum storage bytes (default: 50MB)
}
```

### Log Entry Format

```typescript
interface LogEntry {
  id?: number; // Auto-generated ID
  timestamp: number; // Unix timestamp
  level: string; // Log level (DEBUG, INFO, WARN, ERROR)
  message: string; // Log message content
}
```

## S3 Integration

### Presigned URL API

The worker expects a POST endpoint that accepts:

```json
{
  "meetingId": "meeting-123",
  "attendeeId": "attendee-456"
}
```

With headers:

```
Authorization: Bearer {joinToken}
Content-Type: application/json
```

And returns:

```json
{
  "presignedUrl": "https://s3-presigned-url..."
}
```

### S3 Object Key Format

Logs are uploaded to S3 with the following key structure:

```
chime-client-logs/{region}/{awsAccountId}/{meetingId}/{attendeeId}/{filename}
```

### Upload Constraints

- **File Size**: 10MB maximum per upload
- **Content Type**: `application/gzip` required
- **Key Prefix**: Enforced by S3 policies
- **Metadata**: meetingId and attendeeId attached as S3 object metadata

## Browser Compatibility

### Required Features

- **IndexedDB**: For persistent storage
- **Web Workers**: For background processing
- **Fetch API**: For HTTP requests
- **CompressionStream**: For GZIP compression (with fallback)

### Supported Browsers

- Chrome 76+
- Firefox 65+
- Safari 14+
- Edge 79+

## Error Handling

The worker implements comprehensive error handling:

- **Storage Errors**: Automatic cleanup and retry
- **Network Errors**: Exponential backoff retry logic
- **Quota Exceeded**: Automatic log cleanup
- **Worker Failures**: Error messages sent to main thread

## Performance Considerations

- **Non-blocking**: All operations run in web worker
- **Compression**: GZIP reduces upload size by ~70%
- **Batching**: Single upload operation for all logs
- **Cleanup**: Automatic removal of old logs when limits exceeded
- **Memory Efficient**: Streaming compression for large log sets

## Security

- **Bearer Authentication**: Secure API access using join tokens
- **Presigned URLs**: No AWS credentials exposed to client
- **HTTPS Only**: Encrypted data transmission
- **Policy Enforcement**: S3 policies enforce upload constraints
- **Local Storage**: IndexedDB data is origin-isolated

## Testing

See `S3LogWorkerExample.ts` for a complete example of how to test the S3LogWorker functionality.

## Integration with Amazon Chime SDK

This S3LogWorker is designed to be integrated with the Amazon Chime SDK's logging system. The `S3Logger` class in `../logger/S3Logger.ts` provides the main thread interface that uses this worker for background log processing.
