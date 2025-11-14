// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import LogWorker from './LogWorker';

/**
 * Message types for communication between main thread and S3LogWorker
 */
export enum S3LogWorkerCommand {
  INITIALIZE = 'LOG_WORKER_INITIALIZE',
  PUT_LOG = 'PUT_LOG',
  UPLOAD_LOGS = 'UPLOAD_LOGS',
  UPDATE_METADATA = 'UPDATE_METADATA',
  TERMINATE = 'TERMINATE',
  
  // Response commands
  READY = 'LOG_WORKER_READY',
  ERROR = 'LOG_WORKER_ERROR',
  TERMINATED = 'LOG_WORKER_TERMINATED',
  UPLOAD_COMPLETE = 'LOG_UPLOAD_COMPLETE',
  UPLOAD_FAILED = 'LOG_UPLOAD_FAILED'
}

/**
 * Log entry structure for IndexedDB storage
 */
interface LogEntry {
  id?: number;
  timestamp: number;
  level: string;
  message: string;
}

/**
 * Configuration for S3LogWorker initialization
 */
interface S3LogWorkerConfig {
  presignedUrlEndpoint?: string;
  meetingId?: string;
  attendeeId?: string;
  joinToken?: string;
  maxEntries?: number;
  maxBytes?: number;
}

/**
 * S3LogWorker handles log storage in IndexedDB and upload to S3 via presigned URLs.
 * This worker runs in the background to avoid blocking the main thread.
 */
export default class S3LogWorker implements LogWorker {
  private db: IDBDatabase | null = null;
  private config: S3LogWorkerConfig = {};
  private postMessage: ((message: any) => void) | null = null;

  // Storage limits
  private readonly DEFAULT_MAX_ENTRIES = 500;
  private readonly DB_NAME = 'ChimeS3LogsDB';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'logs';

  /**
   * Initialize the S3LogWorker with configuration
   */
  init(data: any, postMessage: (message: any) => void, close: () => void): void {
    this.postMessage = postMessage;
    
    if (data.config) {
      this.config = { ...this.config, ...data.config };
    }

    this.initializeDatabase()
      .then(() => {
        this.sendMessage(S3LogWorkerCommand.READY, { 
          message: 'S3LogWorker initialized successfully' 
        });
      })
      .catch((error) => {
        this.sendMessage(S3LogWorkerCommand.ERROR, { 
          error: `Failed to initialize database: ${error.message}` 
        });
      });
  }

  /**
   * Store a log entry in IndexedDB
   */
  async putLog(data: any): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const logEntry: LogEntry = {
      timestamp: Date.now(),
      level: data.level || 'INFO',
      message: data.message || ''
    };

    try {
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.add(logEntry);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Check if we need to cleanup old logs
      await this.cleanupIfNeeded();
      
    } catch (error) {
      this.sendMessage(S3LogWorkerCommand.ERROR, { 
        error: `Failed to store log: ${error.message}` 
      });
    }
  }


  /**
   * Upload logs to S3 using presigned URL
   */
  async uploadLogs(): Promise<string> {
    try {
      // Get all logs from IndexedDB
      const logs = await this.getAllLogs();
      
      if (logs.length === 0) {
        return 'No logs to upload';
      }

      // Convert logs to string format
      const logString = this.logsToString(logs);
      
      // Compress logs
      const compressedLogs = await this.compressLogs(logString);
      
      // Get presigned URL
      const presignedUrl = await this.getPresignedUrl(this.config.joinToken);
      
      // Upload to S3
      await this.uploadToS3(presignedUrl, compressedLogs);
      
      // Clear uploaded logs from IndexedDB
      await this.clearLogs();
      
      this.sendMessage(S3LogWorkerCommand.UPLOAD_COMPLETE, { 
        message: `Successfully uploaded ${logs.length} logs` 
      });
      
      return `Successfully uploaded ${logs.length} logs`;
      
    } catch (error) {
      const errorMessage = `Upload failed: ${error.message}`;
      this.sendMessage(S3LogWorkerCommand.UPLOAD_FAILED, { 
        error: errorMessage 
      });
      throw new Error(errorMessage);
    }
  }

  /**
   * Initialize IndexedDB database
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Get all logs from IndexedDB
   */
  private async getAllLogs(): Promise<LogEntry[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Convert logs to string format
   */
  private logsToString(logs: LogEntry[]): string {
    return logs
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(log => {
        const timestamp = new Date(log.timestamp).toISOString();
        return `${timestamp} [${log.level}] ${log.message}`;
      })
      .join('\n');
  }

  /**
   * Compress logs using gzip
   */
  private async compressLogs(logString: string): Promise<Uint8Array> {
    // Use CompressionStream if available (modern browsers)
    if ('CompressionStream' in globalThis) {
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(logString));
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      // Combine chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      return result;
    } else {
      // Fallback: return uncompressed data
      // In a real implementation, you might want to use a polyfill like pako
      return new TextEncoder().encode(logString);
    }
  }

  /**
   * Get presigned URL from the API endpoint
   */
  private async getPresignedUrl(joinToken: string): Promise<string> {
    if (!this.config.presignedUrlEndpoint) {
      throw new Error('Presigned URL endpoint not configured');
    }

    const response = await fetch(this.config.presignedUrlEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${joinToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        meetingId: this.config.meetingId,
        attendeeId: this.config.attendeeId
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to get presigned URL: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.presignedUrl;
  }

  /**
   * Upload compressed logs to S3
   */
  private async uploadToS3(presignedUrl: string, compressedLogs: Uint8Array): Promise<void> {
    const response = await fetch(presignedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/gzip'
      },
      body: compressedLogs as BodyInit
    });

    if (!response.ok) {
      throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Clear all logs from IndexedDB after successful upload
   */
  private async clearLogs(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cleanup old logs if storage limits are exceeded
   */
  private async cleanupIfNeeded(): Promise<void> {
    if (!this.db) {
      return;
    }

    const maxEntries = this.config.maxEntries || this.DEFAULT_MAX_ENTRIES;
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const countRequest = store.count();
      
      countRequest.onsuccess = () => {
        const count = countRequest.result;
        
        if (count > maxEntries) {
          // Delete oldest entries (keep newest maxEntries * 0.8)
          const keepCount = Math.floor(maxEntries * 0.8);
          const deleteCount = count - keepCount;
          
          const index = store.index('timestamp');
          const cursorRequest = index.openCursor();
          let deletedCount = 0;
          
          cursorRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            
            if (cursor && deletedCount < deleteCount) {
              cursor.delete();
              deletedCount++;
              cursor.continue();
            } else {
              resolve();
            }
          };
          
          cursorRequest.onerror = () => reject(cursorRequest.error);
        } else {
          resolve();
        }
      };
      
      countRequest.onerror = () => reject(countRequest.error);
    });
  }

  /**
   * Send message to main thread
   */
  private sendMessage(command: S3LogWorkerCommand, data: any = {}): void {
    if (this.postMessage) {
      this.postMessage({
        command,
        ...data
      });
    }
  }
}