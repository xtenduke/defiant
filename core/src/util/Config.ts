export class Config {
    public static safeParseInt(input: string): number | undefined {
        if (input && ! isNaN(parseInt(input))) {
            return parseInt(input);
        } else {
            return undefined;
        }
    }
}
