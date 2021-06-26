enum Level {
    'DEBUG',
    'LOG',
    'WARN',
    'ERROR',
}

export class Logger {
    private static context: any;

    // todo: CLS hooked would be nice
    public static updateContext(values: any): void {
        this.context = {
            ...this.context,
            ...values,
        };
    }

    static debug(...values: any): void {
        Logger.output(Level.DEBUG, values);
    }

    static log(...values: any): void {
        Logger.output(Level.LOG, values);
    }

    static warn(...values: any): void {
        Logger.output(Level.WARN, values);
    }

    static error(...values: any): void {
        Logger.output(Level.ERROR, values);
    }

    private static output(level: Level, values: any[]): void {
        if (process.env.NODE_ENV === 'production' && level === Level.DEBUG) {
            // ignored log level
            return;
        }

        // add log context
        values.push(this.context);

        let prefix, output = '';
        const suffix = '\x1b[0m';

        switch (level) {
        case Level.DEBUG:
            // no color
            prefix = '\x1b[37m';
            output = '[debug] -';
            break;
        case Level.LOG:
            // green
            prefix = '\x1b[32m';
            output = '[log] -';
            break;
        case Level.WARN:
            // yellow
            prefix = '\x1b[33m';
            output = '[warn] -';
            break;
        case Level.ERROR:
            // red
            prefix = '\x1b[31m';
            output = '[error] -';
            break;
        }

        for (const value of values) {
            if (typeof value === 'string') {
                output += ` ${value}`;
            } else if (value instanceof Error) {
                output += ` ${value}`;
            } else {
                output += ` ${JSON.stringify(value)}`;
            }
        }

        const date = new Date().toISOString();
        console.log(`${prefix}${date} ${output}${suffix}`);
    }
}