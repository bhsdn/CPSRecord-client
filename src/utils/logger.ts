/**
 * 日志系统
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;
  private level: LogLevel;

  constructor() {
    this.level = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.INFO;
  }

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      data,
    };

    // 添加到日志队列
    this.logs.push(entry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 输出到控制台
    this.printLog(entry);
  }

  /**
   * 打印日志到控制台
   */
  private printLog(entry: LogEntry): void {
    const prefix = `[${new Date(entry.timestamp).toLocaleTimeString()}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || "");
        break;
      case LogLevel.INFO:
        console.log(message, entry.data || "");
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || "");
        break;
      case LogLevel.ERROR:
        console.error(message, entry.data || "");
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }
  }

  /**
   * Debug级别日志
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Info级别日志
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Warning级别日志
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Error级别日志
   */
  error(message: string, error?: any): void {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      data: error,
      stack: error?.stack,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.printLog(entry);
  }

  /**
   * 获取日志列表
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 导出日志（用于调试）
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

