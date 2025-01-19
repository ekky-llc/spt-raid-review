import { account } from "./controller/account";
import { raid } from "./controller/raid";
import { supabaseConnect } from "./controller/supabase";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		const supabase = supabaseConnect(env.SUPABASE_URL, env.SUPABASE_KEY);

		const routes: Array<{ method: string, human: string, pattern: RegExp; handler: (params: Record<string, string>, request: Request) => Promise<Response> }> = [
			{
				method: 'GET',
				human: '/api/raid/all',
				pattern: /^\/api\/raid\/all/, 
				handler: async () => {
					const data = await raid.getRaids(supabase, 7);
					return new Response(JSON.stringify(data));
				},
			},
			{
				method: 'GET',
				human: '/api/raid/:raidId',
				pattern: /^\/api\/raid\/(?<raidId>[^/]+)$/,
				handler: async (params) => new Response(`Raid ID: ${params.raidId}`),
			},
			{
				method: 'GET',
				human: '/api/account/:discordId',
				pattern: /^\/api\/account\/(?<discordId>[^/]+)$/,
				handler: async (params) => {
					const data = await account.getAccount(supabase, params.discordId);
					return new Response(JSON.stringify(data));
				},
			},
			{
				method: 'POST',
				human: '/api/account/:discordAuthToken',
				pattern: /^\/api\/account\/(?<discordAuthToken>[^/]+)$/,
				handler: async (params) => {
					const data = await account.registerAccount(supabase, params.discordAuthToken);
					return new Response(JSON.stringify(data));
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