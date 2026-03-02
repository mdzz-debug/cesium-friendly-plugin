export class Logger {
  static get prefix() {
    return '%c[CesiumFriendly]';
  }

  static get style() {
    return 'color: #42b883; font-weight: bold;';
  }

  static info(...args) {
    console.log(Logger.prefix, Logger.style, ...args);
  }

  static warn(...args) {
    console.warn(Logger.prefix, Logger.style, ...args);
  }

  static error(...args) {
    console.error(Logger.prefix, Logger.style, ...args);
  }
}
