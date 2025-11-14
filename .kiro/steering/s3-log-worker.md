# S3LogWorker Feature Steering Document

## Overview

The S3LogWorker is a standalone web worker class that receives log messages via postMessage, stores them locally in IndexedDB, and uploads them to S3 using presigned URLs. This is an independent component that can be integrated with any logging system later.

## Core Components

### S3LogWorker (Web Worker)

- Receives log messages via `postMessage` from main thread
- Manages IndexedDB storage operations
- Handles log batching and compression (GZIP)
- Manages presigned URL acquisition and S3 uploads
- Implements retry logic with exponential backoff
- Provides explicit upload function for manual triggering

### IndexedDB Storage

- Persistent storage for logs across page refreshes
- Configurable storage limits (50MB desktop, 10MB mobile)
- Automatic cleanup when limits exceeded
- Structured log entries with metadata

## Key Features

### Log Collection

- **Message-Based**: Receives logs via `postMessage` from main thread
- **Structured Logging**: Consistent format with timestamps and metadata
- **Flexible Input**: Accepts any log format from calling application

### Storage Management

- **Persistent Storage**: IndexedDB for cross-session persistence
- **Batching**: Logs collected and stored until upload is triggered
- **Compression**: GZIP compression before upload (70% size reduction)
- **Cleanup**: Automatic trimming when storage limits reached

### Upload Mechanism

- **Manual Trigger**: Upload function must be explicitly called
- **Presigned URLs**: Acquired via HTTP API with Bearer token authentication
- **API Integration**: POST request to provided endpoint with meetingId and attendeeId
- **Single Upload**: Upload all stored logs in one operation (no parallel uploads)
- **Retry Logic**: Exponential backoff for failed uploads
- **Security Policies**: S3 policies enforce upload constraints

## Architecture Patterns

### Web Worker Pattern

- **Background Processing**: Non-blocking log operations
- **Message Passing**: Structured communication via `postMessage`
- **Lifecycle Management**: Proper initialization and cleanup
- **Error Handling**: Graceful degradation on worker failures

### Storage Pattern

- **IndexedDB Wrapper**: Use Dexie.js for simplified database operations
- **Schema Versioning**: Support for database migrations
- **Transaction Safety**: Atomic operations for data integrity
- **Query Optimization**: Indexed fields for efficient retrieval

### Upload Pattern

- **Manual Trigger**: Explicit message to initiate upload
- **API Authentication**: Bearer token authentication for presigned URL acquisition
- **Presigned POST**: Secure uploads with policy enforcement
- **Single Operation**: Upload all stored logs in one batch
- **Retry Strategy**: Resilient upload mechanism with exponential backoff
- **Metadata Attachment**: S3 object metadata for meetingId and attendeeId

## Configuration

### Storage Limits

```typescript
const STORAGE_LIMITS = {
  desktop: {
    maxEntries: 500,
    maxBytes: 50 * 1024 * 1024, // 50MB
  },
  mobile: {
    maxEntries: 150,
    maxBytes: 10 * 1024 * 1024, // 10MB
  },
};

const API_CONFIG = {
  endpoint: '', // Provided endpoint URL
  headers: {
    Authorization: 'Bearer {joinToken}',
    'Content-Type': 'application/json',
  },
  payload: {
    meetingId: '', // From initialization parameters
    attendeeId: '', // From initialization parameters
  },
};

const S3_OBJECT_KEY_FORMAT =
  'chime-client-logs/{region}/{awsAccountId}/{meetingId}/{attendeeId}/{filename}';
```

### Upload Configuration

- **Manual Trigger**: Upload only when `uploadLogs()` function is called
- **API Endpoint**: Configurable HTTP endpoint for presigned URL acquisition
- **Authentication**: Bearer token using join token from initialization
- **Request Payload**: Include meetingId and attendeeId in request body
- **S3 Object Key**: Uses format `chime-client-logs/{region}/{awsAccountId}/{meetingId}/{attendeeId}/{filename}`
- **File Constraints**: 10MB limit, gzip content type, specific key prefix enforcement

## Integration Points

### Web Worker Interface

- **Initialization**: Provide endpoint URL, meetingId, attendeeId, and joinToken
- **Message Protocol**: Structured postMessage communication
- **Log Input**: Accept log messages with timestamp and content
- **Upload Trigger**: Expose uploadLogs() function via message handling

### Backend Integration

- **Presigned URLs**: Acquire via HTTP POST to provided API endpoint
- **Authentication**: Bearer token authentication using join token
- **Request Format**: JSON payload with meetingId and attendeeId
- **S3 Bucket**: Organized by region/account/meeting/attendee hierarchy
- **Policies**: Enforce 10MB limit, gzip content type, and key prefix constraints
- **TTL**: 30-day retention policy for cost management

## Security Considerations

### Upload Security

- **Bearer Authentication**: Secure API access using join token
- **Presigned Policies**: Enforce file size, type, and destination
- **Token Validation**: Secure presigned URL acquisition via authenticated API
- **HTTPS Only**: Encrypted data transmission
- **Access Control**: Proper S3 bucket permissions

## Performance Considerations

### Main Thread Impact

- **Minimal Blocking**: Async operations and web worker usage
- **Message Size**: Keep log messages small and flat
- **Batching**: Reduce postMessage frequency
- **Error Handling**: Graceful degradation without blocking UI

### Storage Efficiency

- **Compression**: GZIP before storage and upload
- **Indexing**: Efficient database queries
- **Cleanup**: Regular maintenance to prevent bloat
- **Limits**: Enforce storage quotas

### Network Optimization

- **Batch Uploads**: Reduce HTTP request overhead
- **Compression**: Minimize bandwidth usage
- **Retry Logic**: Handle network failures gracefully
- **Single Upload**: One upload operation per trigger (no parallel uploads)

## Error Handling

### Worker Failures

- **Error Messages**: Send error notifications back to main thread
- **Recovery**: Attempt operation restart on failures
- **Monitoring**: Track worker health and performance
- **Graceful Degradation**: Continue storing logs even if uploads fail

### Storage Failures

- **Quota Exceeded**: Automatic cleanup and retry
- **Corruption**: Database recovery mechanisms
- **Browser Support**: Fallback for unsupported browsers
- **Permissions**: Handle storage permission issues

### Upload Failures

- **Retry Strategy**: Exponential backoff with jitter
- **Circuit Breaker**: Prevent excessive retry attempts
- **Offline Support**: Queue uploads for later retry
- **Error Reporting**: Log upload failures for monitoring

## Testing Strategy

### Unit Testing

- **Web Worker**: Mock worker communication and message handling
- **Storage**: Test IndexedDB operations
- **Upload Trigger**: Test manual upload function
- **Message Protocol**: Test postMessage communication

### Integration Testing

- **End-to-End**: Full log collection and upload flow
- **Browser Compatibility**: Test across supported browsers
- **Storage Limits**: Verify cleanup and limit enforcement
- **Network Conditions**: Test under various network scenarios

### Performance Testing

- **Memory Usage**: Monitor memory consumption
- **Storage Performance**: Test large log volumes
- **Upload Performance**: Measure upload times and success rates
- **Main Thread Impact**: Ensure non-blocking operations

## Monitoring and Observability

### Metrics

- **Upload Success Rate**: Track successful vs failed uploads
- **Storage Usage**: Monitor IndexedDB utilization
- **Performance**: Measure operation times and throughput
- **Error Rates**: Track various failure modes

### Logging

- **Worker Logs**: Internal logging for debugging
- **Upload Logs**: Track upload attempts and results
- **Error Logs**: Detailed error information
- **Performance Logs**: Timing and resource usage data

This steering document provides the foundation for implementing a standalone S3LogWorker web worker class that can be integrated with any logging system later.
