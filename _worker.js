export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === 'theocraft.pages.dev') {
      url.hostname = 'theocraft.cn';
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  }
};