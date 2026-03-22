declare module 'gifshot' {
  export interface GifOptions {
    images: string[];
    interval?: number;
    gifWidth?: number;
    gifHeight?: number;
    sampleInterval?: number;
    numWorkers?: number;
    filter?: string;
    fontWeight?: string;
    fontSize?: string;
    fontFamily?: string;
    fontColor?: string;
    textAlign?: string;
    textBaseline?: string;
    text?: string;
    watermark?: string;
    watermarkHeight?: number;
    watermarkWidth?: number;
    watermarkX?: number;
    watermarkY?: number;
  }

  export interface GifResult {
    error: boolean;
    errorCode: string;
    errorMsg: string;
    image: string;
  }

  export function createGIF(
    options: GifOptions,
    callback: (result: GifResult) => void
  ): void;

  const gifshot: {
    createGIF: typeof createGIF;
  };

  export default gifshot;
}
