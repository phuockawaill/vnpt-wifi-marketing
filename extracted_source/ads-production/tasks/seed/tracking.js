import fs from 'fs';
import path from 'path';
import Promise from 'bluebird';
import mongo from 'mongodb';
import moment from 'moment';
const data = require('./tracking.json');
const debug = require('debug')('seed:tracking');
import {
  standardizeMacAddress,
  standardizeGender,
  standardizeAgeAndIncome,
  standardizeOs,
  standardizeDevice
} from '../../server/import/utils';

export default function (app) {
  'use strict';

  const {TrackingCached} = app.models;
  const {Location, Banner, Brand, Campaign, Profile, User, SelectOption} = app.models;

  const insertRow = (row) => {
    const args = {};
    args.actionType = 'click';
    args.mac = standardizeMacAddress(row.mac);
    args.advertiserId = row.advertiserId;
    args.advertiserName = row.advertiserName;
    args.brandId = row.brandId;
    args.brandName = row.brandName;
    args.campaignId = row.campaignId;
    args.campaignName = row.campaignName;
    args.campaignCategoryId = row.campaignCategoryId;
    args.campaignCategoryName = row.campaignCategoryName;
    args.bannerId = row.bannerId;
    args.bannerName = row.bannerName;
    args.locationId = row.locationId;
    args.locationName = row.locationName;
    args.locationCategoryId = row.locationCategoryId;
    args.locationCategoryName = row.locationCategoryName;
    args.cityId = row.cityId;
    args.cityName = row.cityName;
    args.os = standardizeOs(row.os);
    args.device = standardizeDevice(row.device);
    args.deviceModel = row.model;
    args.name = row.name;
    args.email = row.email;
    args.gender = standardizeGender(row.gender);
    args.age = standardizeAgeAndIncome(row.survey01);
    args.income = standardizeAgeAndIncome(row.survey02);
    args.phone = row.phone;
    args.userType = row.user_type;
    args.createdAt = moment(row.created_at);
    args.updatedAt = moment(row.updated_at);

    const arg2s = {};
    arg2s.actionType = 'impression';
    arg2s.mac = standardizeMacAddress(row.mac);
    arg2s.advertiserId = row.advertiserId;
    arg2s.advertiserName = row.advertiserName;
    arg2s.brandId = row.brandId;
    arg2s.brandName = row.brandName;
    arg2s.campaignId = row.campaignId;
    arg2s.campaignName = row.campaignName;
    arg2s.campaignCategoryId = row.campaignCategoryId;
    arg2s.campaignCategoryName = row.campaignCategoryName;
    arg2s.bannerId = row.bannerId;
    arg2s.bannerName = row.bannerName;
    arg2s.locationId = row.locationId;
    arg2s.locationName = row.locationName;
    arg2s.locationCategoryId = row.locationCategoryId;
    arg2s.locationCategoryName = row.locationCategoryName;
    arg2s.cityId = row.cityId;
    arg2s.cityName = row.cityName;
    arg2s.os = standardizeOs(row.os);
    arg2s.device = standardizeDevice(row.device);
    arg2s.deviceModel = row.model;
    arg2s.createdAt = moment(row.created_at);
    arg2s.updatedAt = moment(row.updated_at);

    // return [args, arg2s];
    return TrackingCached.create(arg2s).then(() => {
      if (Math.random() > 0.5) {
        return TrackingCached.create(args);
      }
    });
  };
  const importTrackingData = (file, campaigns) => {
    console.log(`Parsing ${file}...`);
    const readFile = Promise.promisify(fs.readFile, { context: fs });
    return readFile(file, 'utf8')
      .then(content => {
        const oldTrackingData = JSON.parse(content);
        return Promise.map(oldTrackingData, row => {
          let idx = campaigns.length;
          while (idx >= campaigns.length) {
            idx = Math.round(Math.random() * campaigns.length);
          }
          const campaign = campaigns[idx];
          row.advertiserId = campaign.ownedBy;
          row.advertiserName = campaign.ownedByUsername;
          row.brandId = campaign.brandId;
          row.brandName = campaign.brandName;
          row.campaignId = campaign.id;
          row.campaignName = campaign.name;
          row.campaignCategoryId = campaign.categoryId;
          row.campaignCategoryName = campaign.categoryName;

          idx = campaign.locations.length;
          while (idx >= campaign.locations.length) {
            idx = Math.round(Math.random() * campaign.locations.length);
          }
          row.locationId = campaign.locations[idx].locationId;
          row.locationName = campaign.locations[idx].locationName;
          row.locationCategoryId = campaign.locations[idx].categoryId;
          row.locationCategoryName = campaign.locations[idx].categoryName;
          row.cityId = campaign.locations[idx].cityId;
          row.cityName = campaign.locations[idx].cityName;

          if (standardizeDevice(row.device) == 'mobile' || standardizeDevice(row.device) == 'tablet') {
            row.bannerId = campaign.bannerMobileId;
            row.bannerName = campaign.bannerMobileName;
          } else {
            row.bannerId = campaign.bannerDesktopId;
            row.bannerName = campaign.bannerDesktopName;
          }

          return insertRow(row);
        });
      });
  };

  return Promise
    .all([
      User.find({ where: { profileName: Profile.ADVERTISER } }),
      User.find({ where: { profileName: Profile.PUBLISHER } }),
      User.find({ where: { profileName: Profile.CLIENT } })
    ])
    .then(([advertisers, publishers, clients]) => {
      return Promise.all([
        advertisers,

        SelectOption.find({ where: { type: 'campaign_category' } }),

        Promise.reduce(data.locations, (result, location) => {
          location.ownedBy = mongo.ObjectId(location.ownedBy);

          return Location
            .create(location)
            .then(o => {
              result.push(o);
              return result;
            })
            .catch(console.error);
        }, []),

        Promise.reduce(data.banners, (result, banner) => {
          banner.ownedBy = mongo.ObjectId(banner.ownedBy);

          return Banner
            .create(banner)
            .then(o => {
              result.push(o);
              return result;
            })
            .catch(console.error);
        }, []),

        Promise.reduce(data.brands, (result, brand) => {
          brand.ownedBy = mongo.ObjectId(brand.ownedBy);

          return Brand
            .create(brand)
            .then(o => {
              result.push(o);
              return result;
            })
            .catch(console.error);
        }, [])
      ]);
    })
    .then(([advertisers, categories, locations, banners, brands]) => {
      debug('Locations', locations);
      debug('Banners', banners);
      debug('Brands', brands);

      return Promise.reduce(data.campaigns, (result, campaign) => {
        campaign.ownedBy = mongo.ObjectId(campaign.ownedBy);
        campaign.brandId = mongo.ObjectId(campaign.brandId);

        campaign.locations = campaign.locations.map(l => {
          l.locationId = mongo.ObjectId(l.locationId);
          return l;
        });

        campaign.bannerMobileId = mongo.ObjectId(campaign.bannerMobileId);
        campaign.bannerDesktopId = mongo.ObjectId(campaign.bannerDesktopId);

        return Campaign
          .create(campaign)
          .then(o => {
            result.push(o);
            return result;
          })
          .catch(debug);
      }, []);
    })
    .then(campaigns => {
      debug('Campaigns', campaigns);
      if (process.env.TRACKING) {
        return Promise
          .reduce([1, 2, 3], (_, num) => {
            return importTrackingData(path.join(__dirname, `./tracking${num}.json`), campaigns);
          }, 0);
      }
    })
    .catch(console.error);
}
