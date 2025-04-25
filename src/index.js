import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import TurndownService from 'turndown';
import fs from 'fs/promises';
import path from 'path';

const sitemapUrl = 'https://jacksonswash.com/page-sitemap.xml';
const turndownService = new TurndownService();

// Define output directories
const textOutputDir = 'scraped_text';
const markdownOutputDir = 'scraped_markdown';
const xmlOutputDir = 'scraped_xml';

// Configure turndown to handle links
turndownService.addRule('linkWithUrl', {
  filter: 'a',
  replacement: function (content, node) {
    const href = node.getAttribute('href') || '';
    // Restore original user edit: Output standard markdown links
    return href ? `[${content.trim()}](${href})`.trim() : content;
  }
});

// Function to fetch content
async function getContentFromUrl(url) {
  console.log(`Processing: ${url}`);
  try {
    const dom = await JSDOM.fromURL(url);
    const { document } = dom.window;
    const title = document.querySelector('title')?.textContent || 'No Title Found';

    document.querySelectorAll('script, style').forEach(el => el.remove());
    // Apply user's previous edit to remove forms
    document.querySelectorAll('header, nav, button, footer, noscript, form').forEach(el => el.remove());
    document.querySelectorAll(
      '.modal, .dropdown, .popup, .tooltip, [hidden], [aria-hidden="true"], .hidden'
    ).forEach(el => el.remove());

    const relevantHtml = document.body.innerHTML || "";
    let relevantText = document.body.textContent || "";
    relevantText = relevantText.replace(/\s+/g, ' ').trim();

    return { html: relevantHtml, text: relevantText, title: title };
  } catch (error) {
    console.error(`Error processing ${url}: ${error.message}`);
    return { html: "", text: "", title: "Error Fetching Title" };
  }
}

// Helper function to sanitize URL for filename (accepts extension)
function sanitizeUrlForFilename(url, extension) {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
    .replace(/_+/g, '_')
    .replace(/\.$/, '') // Remove trailing dot if any
    + extension; // Use provided extension
}

// Generic function to save content to a file in a specific directory
async function saveContentToFile(outputDir, url, content, extension, fileTypeLabel) {
  const filename = sanitizeUrlForFilename(url, extension);
  const filepath = path.join(outputDir, filename);

  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(filepath, content, 'utf8');
    console.log(`${fileTypeLabel} content saved to ${filepath}`);
  } catch (writeError) {
    console.error(`Failed to write ${fileTypeLabel} file ${filepath}: ${writeError.message}`);
  }
}

// Specific save functions using the generic one
async function savePageAsText(url, textContent) {
  await saveContentToFile(textOutputDir, url, textContent, '.txt', 'Text');
}

async function savePageAsMarkdown(url, markdownContent) {
  await saveContentToFile(markdownOutputDir, url, markdownContent, '.md', 'Markdown');
}

async function savePageAsXml(url, title, markdownContent) {
  const filename = sanitizeUrlForFilename(url, '.xml');
  const filepath = path.join(xmlOutputDir, filename);
  const escapedTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedLink = url.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const xmlContent = `
<page>
  <link>${escapedLink}</link>
  <title>${escapedTitle}</title>
  <content><![CDATA[
${markdownContent}
  ]]></content>
</page>
`.trim();

  await saveContentToFile(xmlOutputDir, url, xmlContent, '.xml', 'XML');
}


// Function to process a single URL and save outputs
async function processSingleUrl(url) {
  console.log(`\nProcessing single URL: ${url}`);
  const { html, text, title } = await getContentFromUrl(url);

  if (!html && !text) {
    console.error(`Failed to retrieve content from ${url}`);
    return;
  }

  const markdown = turndownService.turndown(html);

  // Save individual files
  await savePageAsText(url, text);
  await savePageAsMarkdown(url, markdown);
  await savePageAsXml(url, title, markdown);

  // Log snippets (optional)
  console.log("\n=== Text Content (First 500 chars) ===\n");
  console.log(text.substring(0, 500) + '...');
  console.log("\n=== Markdown Content (First 500 chars) ===\n");
  console.log(markdown.substring(0, 500) + '...');
}


// Function to process the sitemap and save individual files
async function processSitemap() {
  console.log('\nProcessing sitemap...');
  try {
    // Ensure output directories exist (optional, save functions do it too)
    await fs.mkdir(textOutputDir, { recursive: true });
    await fs.mkdir(markdownOutputDir, { recursive: true });
    await fs.mkdir(xmlOutputDir, { recursive: true });

    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }
    const sitemapContent = await response.text();

    const urlRegex = /(https:\/\/jacksonswash\.com\/[^\s<]+)/g;
    const foundUrls = sitemapContent.match(urlRegex) || [];

    const pageUrls = [...new Set(foundUrls)].filter(url =>
      !url.match(/\.(jpg|jpeg|png|gif|svg|xml|css|js)$/i)
    );

    console.log(`Found ${pageUrls.length} unique page URLs in sitemap.`);

    for (const url of pageUrls) {
      const { html: pageHtml, text: pageText, title: pageTitle } = await getContentFromUrl(url);
      if (pageHtml || pageText) { // Process if we got any content
        const pageMarkdown = turndownService.turndown(pageHtml);

        // Save individual files for this page
        await savePageAsText(url, pageText);
        await savePageAsMarkdown(url, pageMarkdown);
        await savePageAsXml(url, pageTitle, pageMarkdown);
      }
    }
    console.log("\nSitemap processing finished.");

  } catch (error) {
    console.error(`Failed to process sitemap: ${error.message}`);
  }
}

// Main execution logic
async function main() {
  const args = process.argv.slice(2);
  const singleUrl = args[0];

  if (singleUrl) {
    if (singleUrl.startsWith('http://') || singleUrl.startsWith('https://')) {
      await processSingleUrl(singleUrl);
    } else {
      console.error('Invalid URL provided. Please start with http:// or https://');
    }
  } else {
    await processSitemap();
  }
}

main();
