export declare enum DeviceVendor {
    VNPT_IGATE = "VNPT_IGATE",
    MIKROTIK = "MIKROTIK",
    UNIFI = "UNIFI",
    RUIJIE = "RUIJIE",
    GENERIC_RADIUS = "GENERIC_RADIUS",
    MOCK = "MOCK"
}
export declare enum CampaignType {
    BANNER_COUNTDOWN = "BANNER_COUNTDOWN",
    VIDEO_WATCH = "VIDEO_WATCH",
    LEAD_FORM = "LEAD_FORM",
    SURVEY_RATING = "SURVEY_RATING",
    ZALO_LOGIN = "ZALO_LOGIN",
    ONE_CLICK = "ONE_CLICK"
}
export declare enum CampaignEventStatus {
    IMPRESSION = "IMPRESSION",
    CLICK = "CLICK",
    COMPLETE = "COMPLETE",
    SUBMIT = "SUBMIT"
}
export interface VenueInfo {
    id: string;
    name: string;
    slug: string;
    address?: string;
    phone?: string;
}
export interface GatewayAuthParams {
    clientMac: string;
    clientIp?: string;
    venueId: string;
    durationMinutes: number;
    downloadSpeedKbps?: number;
    uploadSpeedKbps?: number;
    gatewaySpecificParams?: Record<string, any>;
}
export interface GatewayAuthResult {
    success: boolean;
    message?: string;
    expiresAt: Date;
    redirectUrl?: string;
    rawResponse?: any;
}
export interface IGatewayAdapter {
    vendor: DeviceVendor;
    authorizeGuest(params: GatewayAuthParams): Promise<GatewayAuthResult>;
    revokeGuest(clientMac: string): Promise<boolean>;
    getGuestStatus(clientMac: string): Promise<{
        isAuthorized: boolean;
        remainingMinutes?: number;
    }>;
    testConnection(): Promise<boolean>;
}
export interface BannerCampaignConfig {
    bannerImageUrl: string;
    bannerMobileImageUrl?: string;
    linkUrl?: string;
    countdownSeconds: number;
    buttonText?: string;
}
export interface VideoCampaignConfig {
    videoUrl: string;
    thumbnailUrl?: string;
    minWatchSeconds: number;
    allowSkipAfterSeconds?: number;
    callToActionUrl?: string;
}
export interface LeadFormConfig {
    requireFullName: boolean;
    requirePhone: boolean;
    requireEmail: boolean;
    requireGender: boolean;
    requireAgeRange: boolean;
    customFields?: Array<{
        key: string;
        label: string;
        type: 'text' | 'number' | 'select';
        options?: string[];
        required: boolean;
    }>;
}
export interface SurveyConfig {
    questionTitle: string;
    surveyType: 'RATING_STAR' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'FEEDBACK_TEXT';
    ratingScale?: number;
    options?: Array<{
        id: string;
        label: string;
    }>;
}
export interface CampaignContent {
    banner?: BannerCampaignConfig;
    video?: VideoCampaignConfig;
    leadForm?: LeadFormConfig;
    survey?: SurveyConfig;
}
export interface AuthorizePortalPayload {
    venueId: string;
    campaignId: string;
    clientMac: string;
    clientIp?: string;
    gatewayVendor?: DeviceVendor;
    leadData?: {
        fullName?: string;
        phone?: string;
        email?: string;
        gender?: string;
        ageRange?: string;
    };
    surveyData?: {
        ratingScore?: number;
        answer?: string;
    };
    extraParams?: Record<string, string>;
}
