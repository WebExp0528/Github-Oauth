import { OAuthApp, Octokit, App } from 'octokit';

export const githubOAuthApp = new OAuthApp({
  clientId: process.env.REACT_APP_GITHUB_CLIENT_ID!,
  clientSecret: process.env.REACT_APP_GITHUB_SECRET_KEY!,
  defaultScopes: ['repo', 'gist'],
});

githubOAuthApp.octokit.hook.before('request', (options: any) => {
  options.headers['Access-Control-Allow-Origin'] = '*';
  options.headers['Access-Control-Allow-Methods'] =
    'GET, POST, PUT, DELETE, OPTIONS';
});
