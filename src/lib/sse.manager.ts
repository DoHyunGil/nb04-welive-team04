// src/lib/sse.manager.ts
import type { Response } from 'express';

interface SSEConnection {
  userId: number;
  response: Response;
  lastEventId?: string;
}

interface SSEData {
  type: string;
  data: unknown;
}

export class SSEManager {
  private connections = new Map<number, SSEConnection>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  addConnection(userId: number, response: Response, lastEventId?: string) {
    this.removeConnection(userId);

    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    this.connections.set(userId, { userId, response, lastEventId });

    response.on('close', () => {
      this.removeConnection(userId);
    });

    console.log(
      `[SSE] User ${userId} connected. Total: ${this.connections.size}`,
    );
  }

  removeConnection(userId: number) {
    const connection = this.connections.get(userId);
    if (connection) {
      try {
        connection.response.end();
      } catch {
        /* empty */
      }
      this.connections.delete(userId);
      console.log(
        `[SSE] User ${userId} disconnected. Total: ${this.connections.size}`,
      );
    }
  }

  sendToUser(userId: number, data: SSEData) {
    const connection = this.connections.get(userId);
    if (!connection) return;

    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      connection.response.write(message);
    } catch (err) {
      console.error(`[SSE] Failed to send to user ${userId}:`, err);
      this.removeConnection(userId);
    }
  }

  startHeartbeat(intervalMs = 30000) {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      this.connections.forEach((connection) => {
        try {
          connection.response.write(': heartbeat\n\n');
        } catch {
          this.removeConnection(connection.userId);
        }
      });
    }, intervalMs);

    console.log(`[SSE] Heartbeat started (${intervalMs}ms)`);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  closeAll() {
    this.connections.forEach((connection) => {
      try {
        connection.response.end();
      } catch {
        /* empty */
      }
    });
    this.connections.clear();
    this.stopHeartbeat();
  }

  getConnectionCount() {
    return this.connections.size;
  }
}

export const sseManager = new SSEManager();
