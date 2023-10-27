const Papa =require('papaparse');


const http = require('@/app/library/http');
import mongoConnector from "@/app/library/mongoose";
import TokenHelper from "@/app/library/token";
import RSS from '@/app/library/rss';

export const dynamic = 'force-dynamic'
export async function GET(req, res) {
    let retVal = {};
    let isOneType = false;

    const params = http.getParamsFromRequest(req);
    if(TokenHelper.isTokenValid(params) === false)
        return TokenHelper.getInvalidTokenResponse();

    let objectsToFetch = http.getObjectsToFetchFromParams(params);

    isOneType = (objectsToFetch.length === 1 && !http.isParamsWithAssets(params))

    if (http.isParamsWithAssets(params))
        objectsToFetch.push('assets');

    await mongoConnector.connect();

    for (const type of objectsToFetch) {
        retVal[type] = await mongoConnector.getObjectOfType(type);
    }

    let retStr = JSON.stringify(retVal);
    let retHeader = {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
    };

    if(isOneType){
        if(params.format === 'csv'){
            retStr = Papa.unparse(retVal[objectsToFetch[0]], {header: true});
            retHeader = {
                'Cache-Control': 'no-store',
                'Content-type': 'text/csv',
                'Content-disposition': 'attachment;filename=InspiritReport.csv'
            };
        }else if(params.format==='rss'){
            let count = 0;
            if(params.count !== undefined) {
                count = parseInt(params.count);
                if(count > 10) {
                    count = 10;
                }
            }


            retStr = RSS.makeRSS(retVal[objectsToFetch[0]], objectsToFetch[0], count);
            retHeader = {
                'Cache-Control': 'no-store',
                'Content-type': 'text/xml;charset=UTF-8'
            };
        }
    }

    return new Response(retStr, {
        headers: retHeader,
        status: 200
    });
}