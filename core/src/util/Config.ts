export class Config {
    public static safeParseInt(input: string, fallback?: number): number | undefined {
        if (input && ! isNaN(parseInt(input))) {
            return parseInt(input);
        } else {
            return fallback;
        }
    }
}
