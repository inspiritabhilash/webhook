import mongoHelper from "@/app/library/mongoose";
import contentfulHelper from "@/app/library/contentful";
import http from "@/app/library/http";

const Contentful = require('contentful-wrapper');
const contentfulObj = new Contentful();
const TokenHelper = require('../../../library/token');

export const dynamic = 'force-dynamic'
export async function GET(req, res) {

    const params = http.getParamsFromRequest(req);
    if(!TokenHelper.isTokenValid(params))
        return TokenHelper.getInvalidTokenResponse();


    let objectsToFetch = http.getObjectsToFetchFromParams(params);

    await contentfulHelper.prepare(contentfulObj);
    await mongoHelper.prepare();

    let startTime = new Date();

    let retVal = {};


    for (const type of objectsToFetch) {
        retVal[type] = await contentfulHelper.updateEntriesForType(contentfulObj, type);
    }

    if (http.isAssetParamFalse(params))
        await contentfulHelper.fetchAndPushAllAssets(contentfulObj);

    let endTime = new Date();

    await mongoHelper.insertTimestampWithSummary(startTime, endTime, retVal, objectsToFetch, http.isAssetParamFalse(params), http.getAllObjectTypes());

    return new Response(JSON.stringify({data: retVal, ts: {start: startTime, end: endTime}}), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        },
        status: 200
    });
}