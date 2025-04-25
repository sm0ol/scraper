import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import TurndownService from 'turndown';
import fs from 'fs/promises';

const sitemapUrl = 'https://jacksonswash.com/page-sitemap.xml';
const turndownService = new TurndownService();

// Configure turndown to handle links as plain text
turndownService.addRule('plainLink', {
  filter: 'a',
  replacement: function (content) {
    return content; // Return only the link's text content
  }
});

// Function to fetch and extract relevant HTML and text from a single URL
async function getContentFromUrl(url) {
  console.log(`Processing: ${url}`); // Log progress
  try {
    const dom = await JSDOM.fromURL(url);
    const { document } = dom.window;

    // Remove script and style elements
    document.querySelectorAll('script, style').forEach(el => el.remove());

    // Remove common boilerplate/navigation elements
    // Added noscript as it often contains duplicate or fallback content
    document.querySelectorAll('header, nav, button, footer, noscript').forEach(el => el.remove());

    // Get the relevant HTML content
    const relevantHtml = document.body.innerHTML || "";

    // Get text content from the remaining body
    let relevantText = document.body.textContent || "";

    // Clean up whitespace (replace multiple spaces/newlines with single space, trim)
    relevantText = relevantText.replace(/\s+/g, ' ').trim();

    return { html: relevantHtml, text: relevantText }; // Return both HTML and text
  } catch (error) {
    console.error(`Error processing ${url}: ${error.message}`);
    return { html: "", text: "" }; // Return empty object on error
  }
}

// Function to process a single URL and save output
async function processSingleUrl(url) {
  console.log(`Processing single URL: ${url}`);
  const { html, text } = await getContentFromUrl(url);

  if (!html) {
    console.error(`Failed to retrieve content from ${url}`);
    return;
  }

  const markdown = turndownService.turndown(html);

  try {
    await fs.writeFile('scraped-content.txt', text, 'utf8');
    console.log('\nText content has been saved to scraped-content.txt');
  } catch (writeError) {
    console.error(`Failed to write text file: ${writeError.message}`);
  }

  try {
    await fs.writeFile('scraped-content.md', markdown, 'utf8');
    console.log('\nMarkdown content has been saved to scraped-content.md');
  } catch (writeError) {
    console.error(`Failed to write markdown file: ${writeError.message}`);
  }
  console.log("\n\n=== Text Content ===\n");
  console.log(text.substring(0, 500) + '...');
  console.log("\n\n=== Markdown Content ===\n");
  console.log(markdown.substring(0, 500) + '...');
}

// Function to process the sitemap (modified to reuse getContentFromUrl)
async function processSitemap() {
  let allText = "";
  let allMarkdown = "";
  try {
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
      const { html: pageHtml, text: pageText } = await getContentFromUrl(url);
      if (pageHtml) {
        const pageMarkdown = turndownService.turndown(pageHtml);
        allText += `\n\n--- Page: ${url} ---\n\n`;
        allText += pageText;
        allMarkdown += `\n\n--- Page: ${url} ---\n\n`;
        allMarkdown += pageMarkdown;
      }
    }

    console.log("\n\n=== Combined Text Content ===\n");
    console.log(allText.substring(0, 500) + '...');

    console.log("\n\n=== Combined Markdown Content ===\n");
    console.log(allMarkdown.substring(0, 500) + '...');

    try {
      await fs.writeFile('scraped-content.txt', allText, 'utf8');
      console.log('\nText content has been saved to scraped-content.txt');
    } catch (writeError) {
      console.error(`Failed to write text file: ${writeError.message}`);
    }

    try {
      await fs.writeFile('scraped-content.md', allMarkdown, 'utf8');
      console.log('\nMarkdown content has been saved to scraped-content.md');
    } catch (writeError) {
      console.error(`Failed to write markdown file: ${writeError.message}`);
    }

  } catch (error) {
    console.error(`Failed to process sitemap: ${error.message}`);
  }
}

// Main execution logic
async function main() {
  const args = process.argv.slice(2); // Get command line arguments, excluding node and script path
  const singleUrl = args[0]; // Assume the first argument is the URL

  if (singleUrl) {
    // Validate if it looks like a URL (basic check)
    if (singleUrl.startsWith('http://') || singleUrl.startsWith('https://')) {
      await processSingleUrl(singleUrl);
    } else {
      console.error('Invalid URL provided as argument. Please provide a full URL starting with http:// or https://');
    }
  } else {
    console.log('No URL provided, processing sitemap...');
    await processSitemap();
  }
}

main(); // Call the main function
