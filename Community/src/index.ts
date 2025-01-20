import { account } from "./controller/account";
import { raid } from "./controller/raid";
import { supabaseConnect } from "./controller/supabase";

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
				method: 'GET',
				human: '/api/v1/raid/:raidId',
				pattern: /^\/api\/raid\/(?<raidId>[^/]+)$/,
				handler: async (params) => new Response(`Raid ID: ${params.raidId}`),
			},
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