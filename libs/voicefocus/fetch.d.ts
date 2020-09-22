import { VoiceFocusFetchBehavior } from './types';
export declare function fetchWithBehavior(url: string, init?: RequestInit, fetchBehavior?: VoiceFocusFetchBehavior): Promise<Response>;
export declare function withRequestHeaders(init?: RequestInit, fetchBehavior?: VoiceFocusFetchBehavior): RequestInit | undefined;
export declare function withQueryString(url: string, fetchBehavior?: VoiceFocusFetchBehavior): string;
export declare function addQueryParams(fetchBehavior: VoiceFocusFetchBehavior | undefined, queryParams: {
    [key: string]: string;
}): VoiceFocusFetchBehavior | undefined;
export declare function isValidAssetGroup(assetGroup: string): boolean;
export declare function isValidRevisionID(revisionID: string): boolean;
