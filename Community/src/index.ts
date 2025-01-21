import { gunzip } from "zlib";
import { promisify } from "util";

import { account } from "./controller/account";
import { raid } from "./controller/raid";
import { supabaseConnect } from "./controller/supabase";

const gunzipAsync = promisify(gunzip);

export default {
	async fetch(request, env: Env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// Cors
		if (request.method === 'OPTIONS') {
			return new Response(null, {
			  status: 204,
			  headers: {
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type'
			  }
			});
		}

		const headers = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Content-Type',
			'Content-Type' : 'application/json'
		}

		const supabase = supabaseConnect(env.SUPABASE_URL, env.SUPABASE_KEY);
		const routes: Array<{ method: string, human: string, pattern: RegExp; handler: (params: Record<string, string>, request: Request) => Promise<Response> }> = [

			// Raid Endpoints
			{
				method: 'GET',
				human: '/api/v1/raid/all',
				pattern: /^\/api\/v1\/raid\/all/, 
				handler: async () => {
					const data = await raid.getRaids(supabase, 7);
					return new Response(JSON.stringify(data), {
						headers
					});
				},
			},
			{
				method: 'POST',
				human: '/api/v1/raid/receive',
				pattern: /^\/api\/v1\/raid\/receive/, 
				handler: async (params) => {

					try {

						  const contentType = request.headers.get('Content-Type') || '';
						  if (!contentType.includes('multipart/form-data')) return new Response("Invalid Content-Type", { status: 400 });
				  
						  const formData = await request.formData();
						  const file = formData.get('file') as File;
						  const payloadJson = formData.get('payload') as string;
				  
						  if (!file || !(file instanceof File)) return new Response("File is required", { status: 400 });
						  if (!payloadJson) return new Response("Payload is required", { status: 400 });
						  if (!payloadJson || typeof payloadJson !== 'string') return new Response("Payload is required and must be a valid JSON string", { status: 400 });
					
						  let payload;
						  try {
							payload = JSON.parse(payloadJson);
						  } catch (err) {
							  return new Response("Invalid JSON in payload", { status: 400 });
						  }

						  const compressedBuffer = await file.arrayBuffer();
						  const decompressedBuffer = await gunzipAsync(Buffer.from(compressedBuffer));  

						  const r2Key = `raids/${payload.uploadToken}/${file.name.replace('.raidreview', '.json')}`;
						  const r2Response = await env.RAID_REVIEW.put(r2Key, decompressedBuffer, {
						       httpMetadata: { contentType: "application/json" },
						  });  
						  
						  return new Response(
						  	  JSON.stringify({ success: true }),
						  	  { status: 200, headers: { 'Content-Type': 'application/json' } }
						  );
					  }
					  
					  catch (error) {
						  console.error("Error processing upload:", error);
						  return new Response("Internal Server Error", { status: 500 });
					  }

				},
			},
			{
				method: 'GET',
				human: '/api/v1/raid/:raidId',
				pattern: /^\/api\/raid\/(?<raidId>[^/]+)$/,
				handler: async (params) => new Response(`Raid ID: ${params.raidId}`),
			},

			// Account Endpoints
			{
				method: 'GET',
				human: '/api/v1/account/:discordId',
				pattern: /^\/api\/v1\/account\/(?<discordId>[^/]+)$/,
				handler: async (params) => {
					const data = await account.getAccount(supabase, params.discordId);

					if (data === undefined) {
						const response =  new Response(null , { status: 204 });
						return response;
					}

					return new Response(JSON.stringify(data), {
						headers
					});
				},
			},
			{
				method: 'POST',
				human: '/api/v1/account/register',
				pattern: /^\/api\/v1\/account\/register/, 
				handler: async (params) => {

					const payload = await request.json() as { accessToken: string };
					if (!payload.accessToken) {
						const response =  new Response(`There was a problem registering your account.`, {
							status: 400,
							headers
						});
						return response;
					}

					const data = await account.registerAccount(supabase, payload.accessToken);
					return new Response(JSON.stringify(data), {
						headers
					});
				},
			}
		];


		for (const route of routes) {
			const match = path.match(route.pattern);
			if (match && request.method === route.method) {
				// Extract named groups directly
				const params = match.groups || {};
				return await route.handler(params, request);
			}
		}

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;