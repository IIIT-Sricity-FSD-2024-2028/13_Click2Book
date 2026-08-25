export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}
export declare function successResponse<T>(message: string, data?: T): ApiResponse<T>;
export declare function errorResponse(message: string): ApiResponse;
