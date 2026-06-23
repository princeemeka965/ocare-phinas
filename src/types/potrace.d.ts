/** Minimal ambient types for `potrace` (the package ships none). */
declare module "potrace" {
  export interface PotraceOptions {
    turnPolicy?: string;
    turdSize?: number;
    alphaMax?: number;
    optCurve?: boolean;
    optTolerance?: number;
    threshold?: number;
    blackOnWhite?: boolean;
    color?: string;
    background?: string;
  }

  type TraceInput = Buffer | string;
  type TraceCallback = (err: Error | null, svg: string) => void;

  export function trace(input: TraceInput, options: PotraceOptions, cb: TraceCallback): void;
  export function trace(input: TraceInput, cb: TraceCallback): void;
}
