import http from "@/app/library/http";
import TokenHelper from "@/app/library/token";
import mongoHelper from "@/app/library/mongoose";
import Organization from "@/app/models/organization";
import axios from "axios";

export const dynamic = 'force-dynamic'
export async function GET(req, res) {
    const params = http.getParamsFromRequest(req);
    if(!TokenHelper.isTokenValid(params))
        return TokenHelper.getInvalidTokenResponse();

    await mongoHelper.prepare();

    const orgsWithKeys = await Organization.find({
        manage_xr_api_key: { $exists : true, $ne : null },
        manage_xr_api_secret: { $exists : true, $ne : null },
    }).select({
        manage_xr_api_key: 1,
        manage_xr_api_secret: 1,
        _id: 1,
        name: 1
    }).lean();

    let orgIDs = [];
    orgsWithKeys.forEach((org) => {

       const orgId = String(org._id);
       const orgName = org.name

       orgIDs.push({
           name: orgName,
           id: orgId,
       });

       axios.post(`${process.env.MANAGEXR_HOOK}?token=${process.env.MANAGEXR_TOKEN}`, {
           id: orgId,
           api_key: org.manage_xr_api_key,
           secret: org.manage_xr_api_secret,
           name: orgName
       })
    });



    return new Response(JSON.stringify({data: orgIDs}), {
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
        },
        status: 200
    });
}