const SWAGGER_VERSION = '5.17.14';
const CDN = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}`;

/**
 * Swagger UI varlıkları CDN'den (jsDelivr) yüklenir, spec ise kendi
 * /docs.json ucumuzdan çekilir. swagger-ui-express'in statik dosya
 * servisi serverless/rewrite ortamlarında bozulup "SwaggerUIBundle is
 * not defined" hatası verdiği için bu yaklaşıma geçildi.
 */
export const docsHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Kitaplık API — Docs</title>
  <link rel="stylesheet" href="${CDN}/swagger-ui.css" />
  <style>body { margin: 0; background: #fafafa; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${CDN}/swagger-ui-bundle.js" crossorigin></script>
  <script src="${CDN}/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: '/docs.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'StandaloneLayout',
      });
    };
  </script>
</body>
</html>`;
