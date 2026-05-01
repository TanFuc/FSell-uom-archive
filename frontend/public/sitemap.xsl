<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xhtml="http://www.w3.org/1999/xhtml"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>Sitemap - ƯƠM. Archive</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 14px;
            color: #1a1a1a;
            background-color: #fafafa;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          }
          h1 {
            font-size: 28px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 10px;
            color: #111;
            letter-spacing: -0.5px;
          }
          p.description {
            color: #666;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.5;
          }
          .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          .stat-card {
            background: #f4f4f5;
            padding: 15px 20px;
            border-radius: 8px;
            flex: 1;
          }
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #111;
          }
          .stat-label {
            font-size: 12px;
            color: #71717a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
          }
          th {
            background-color: #f8f8f9;
            color: #111;
            font-weight: 600;
            padding: 12px 16px;
            font-size: 13px;
            border-bottom: 2px solid #e4e4e7;
          }
          td {
            padding: 16px;
            border-bottom: 1px solid #e4e4e7;
            vertical-align: middle;
          }
          tr:hover td {
            background-color: #fcfcfd;
          }
          a {
            color: #2563eb;
            text-decoration: none;
            word-break: break-all;
          }
          a:hover {
            text-decoration: underline;
          }
          .priority-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            background-color: #e0f2fe;
            color: #0369a1;
          }
          .lang-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            background-color: #f1f5f9;
            color: #475569;
            margin-right: 4px;
            margin-bottom: 4px;
          }
          .image-count {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #71717a;
            font-size: 13px;
          }
          .image-icon {
            width: 16px;
            height: 16px;
            fill: currentColor;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>ƯƠM. Archive Sitemap</h1>
          <p class="description">This is a technical file meant for search engines like Google or Bing. It contains all the public URLs of the ƯƠM. Archive platform.</p>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></div>
              <div class="stat-label">Total URLs</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Priority</th>
                <th>Change Freq</th>
                <th>Last Modified</th>
                <th>Alternates</th>
                <th>Images</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                  </td>
                  <td>
                    <span class="priority-badge"><xsl:value-of select="sitemap:priority"/></span>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                  <td>
                    <xsl:for-each select="xhtml:link">
                      <span class="lang-badge">
                        <xsl:value-of select="@hreflang"/>
                      </span>
                    </xsl:for-each>
                  </td>
                  <td>
                    <xsl:if test="count(image:image) &gt; 0">
                      <span class="image-count">
                        <svg class="image-icon" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                        <xsl:value-of select="count(image:image)"/>
                      </span>
                    </xsl:if>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
