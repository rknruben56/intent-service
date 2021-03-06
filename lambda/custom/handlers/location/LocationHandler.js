const request = require('request');
const asyncRequest = require('request-promise');
const API_LOCATION_QUERY = "/v1/devices/{deviceId}/settings/address";
const geocoder = require('./geocoder');
const logger = require("../../logging/Logger");

// Default Location if the API isn't able to get the device's location
const DEFAULT_LOCATION = {
    stateOrRegion: "IL",
    city: "Chicago",
    countryCode: "US",
    postalCode: "98109",
    addressLine1: "243 S Wabash Ave",
    isDefault: true
};

/**
 * Returns an address object
 * @param {string} apiEndpoint
 * @param {string} token
 * @param {string} deviceId
 * @param {function} callback
 */
exports.getLocation = (apiEndpoint, token, deviceId, callback) => {
    // build the api url to get the location
    let url = apiEndpoint + API_LOCATION_QUERY.replace("{deviceId}", deviceId);

    let options = {
        url: url,
        headers: {
            'Authorization': "Bearer " + token
        }
    };

    // Call the Amazon API to get the device's location
    request(options, (error, response, body) => {
        let location = (response && response.statusCode === 200)
            ? JSON.parse(body)
            : DEFAULT_LOCATION;

        // Make an array of the location properties we want to send to the geocoder
        let locationProperties = [location.addressLine1, location.city, location.stateOrRegion, location.postalCode];

        // Next line is filtering out any location properties that aren't null and joining them as a comma separated string
        let locationString = locationProperties.filter((prop) => {return prop !== null}).join(",");
        geocoder.getLatLong(locationString, callback);
    });
};

/**
 * Returns an address object
 * @param {string} apiEndpoint 
 * @param {string} token 
 * @param {string} deviceId
 */
exports.asyncGetLocation = async (apiEndpoint, token, deviceId) => {
    // build the api url to get the location
    let url = apiEndpoint + API_LOCATION_QUERY.replace("{deviceId}", deviceId);

    let locationRequest = {
        url: url,
        headers: {
            'Authorization': "Bearer " + token
        },
        resolveWithFullResponse: true
    };

    
    let response = await asyncRequest(locationRequest)
        .catch(error => {
            logger.error("error with location request: " + error.message);
        });

    let location = (response.statusCode === 200)
        ? JSON.parse(response.body)
        : DEFAULT_LOCATION;

    // Make an array of the location properties we want to send to the geocoder
    let locationProperties = [location.addressLine1, location.city, location.stateOrRegion, location.postalCode];
    
    // Next line is filtering out any location properties that aren't null and joining them as a comma separated string
    let locationString = locationProperties.filter((prop) => {return prop !== null}).join(",");

    let locationObj = await geocoder.asyncGetLatLong(locationString);
    locationObj["isDefault"] = location.isDefault;

    return locationObj;
};