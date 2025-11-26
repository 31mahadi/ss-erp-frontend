type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enabled = process.env.NODE_ENV === "development";

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (!this.enabled) return;

    const prefix = `[${level.toUpperCase()}] ${entry.timestamp.toISOString()}`;

    if (error) {
      // Serialize error properly
      const errorInfo = {
        message: error.message || String(error),
        stack: error.stack,
        name: error.name,
      };

      if (level === "error") {
        // Use console.error specifically for errors
        // Filter out undefined values from context
        const filteredContext = context ? Object.fromEntries(
          Object.entries(context).filter(([_, value]) => value !== undefined)
        ) : {};
        
        if (Object.keys(filteredContext).length > 0) {
          console.error(prefix, message, { ...filteredContext, error: errorInfo });
        } else {
          console.error(prefix, message, errorInfo);
        }
      } else {
        const logMethod = (console[level as keyof Console] || console.log) as typeof console.log;
        // Filter out undefined values from context
        const filteredContext = context ? Object.fromEntries(
          Object.entries(context).filter(([_, value]) => value !== undefined)
        ) : {};
        
        if (Object.keys(filteredContext).length > 0) {
          logMethod(prefix, message, { ...filteredContext, error: errorInfo });
        } else {
          logMethod(prefix, message, errorInfo);
        }
      }
    } else {
      // Filter out undefined values from context
      const filteredContext = context ? Object.fromEntries(
        Object.entries(context).filter(([_, value]) => value !== undefined)
      ) : {};
      
      const logMethod = (console[level as keyof Console] || console.log) as typeof console.log;
      if (Object.keys(filteredContext).length > 0) {
        logMethod(prefix, message, filteredContext);
      } else {
        logMethod(prefix, message);
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log("error", message, context, error);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }
}

export const logger = new Logger();
