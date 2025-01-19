import { raid } from "./controller/raid";
import { supabaseConnect } from "./controller/supabase";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		const supabase = supabaseConnect(env.SUPABASE_URL, env.SUPABASE_KEY);

		const routes: Array<{ pattern: RegExp; handler: (params: Record<string, string>) => Promise<Response> }> = [
			{
				pattern: /^\/api\/raid\/all/, 
				handler: async () => {

					const data = await raid.getRaids(supabase, 7);

					return new Response(JSON.stringify(data));
				},
			},
			{
				pattern: /^\/api\/raid\/(?<raidId>[^/]+)$/,
				handler: async (params) => new Response(`Raid ID: ${params.raidId}`),
			}
		];


		for (const route of routes) {
			const match = path.match(route.pattern);
			if (match) {
				// Extract named groups directly
				const params = match.groups || {};
				return await route.handler(params);
			}
		}

		return new Response('Not Found', { status: 404 });
	},
} satisfies ExportedHandler<Env>;