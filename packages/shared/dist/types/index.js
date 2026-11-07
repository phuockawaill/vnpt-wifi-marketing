"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignEventStatus = exports.CampaignType = exports.DeviceVendor = void 0;
var DeviceVendor;
(function (DeviceVendor) {
    DeviceVendor["VNPT_IGATE"] = "VNPT_IGATE";
    DeviceVendor["MIKROTIK"] = "MIKROTIK";
    DeviceVendor["UNIFI"] = "UNIFI";
    DeviceVendor["RUIJIE"] = "RUIJIE";
    DeviceVendor["GENERIC_RADIUS"] = "GENERIC_RADIUS";
    DeviceVendor["MOCK"] = "MOCK";
})(DeviceVendor || (exports.DeviceVendor = DeviceVendor = {}));
var CampaignType;
(function (CampaignType) {
    CampaignType["BANNER_COUNTDOWN"] = "BANNER_COUNTDOWN";
    CampaignType["VIDEO_WATCH"] = "VIDEO_WATCH";
    CampaignType["LEAD_FORM"] = "LEAD_FORM";
    CampaignType["SURVEY_RATING"] = "SURVEY_RATING";
    CampaignType["ZALO_LOGIN"] = "ZALO_LOGIN";
    CampaignType["ONE_CLICK"] = "ONE_CLICK";
})(CampaignType || (exports.CampaignType = CampaignType = {}));
var CampaignEventStatus;
(function (CampaignEventStatus) {
    CampaignEventStatus["IMPRESSION"] = "IMPRESSION";
    CampaignEventStatus["CLICK"] = "CLICK";
    CampaignEventStatus["COMPLETE"] = "COMPLETE";
    CampaignEventStatus["SUBMIT"] = "SUBMIT";
})(CampaignEventStatus || (exports.CampaignEventStatus = CampaignEventStatus = {}));
