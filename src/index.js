import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';

const sitemapUrl = 'https://jacksonswash.com/page-sitemap.xml';

// Function to fetch and extract text from a single URL
async function getTextFromUrl(url) {
  console.log(`Processing: ${url}`); // Log progress
  try {
    const dom = await JSDOM.fromURL(url);
    const { document } = dom.window;

    // Remove script and style elements
    document.querySelectorAll('script, style').forEach(el => el.remove());

    // Remove common boilerplate/navigation elements
    // Added noscript as it often contains duplicate or fallback content
    document.querySelectorAll('header, nav, button, footer, noscript').forEach(el => el.remove());

    // Get text content from the body
    let relevantText = document.body.textContent || "";

    // Clean up whitespace (replace multiple spaces/newlines with single space, trim)
    relevantText = relevantText.replace(/\s+/g, ' ').trim();

    return relevantText;
  } catch (error) {
    console.error(`Error processing ${url}: ${error.message}`);
    return ""; // Return empty string on error
  }
}

// Main function to process the sitemap
async function processSitemap() {
  let allText = "";
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
    }
    const sitemapContent = await response.text();

    // Regex to find URLs in the sitemap text
    const urlRegex = /(https:\/\/jacksonswash\.com\/[^\s<]+)/g;
    const foundUrls = sitemapContent.match(urlRegex) || [];

    // Filter out non-HTML files and ensure uniqueness
    const pageUrls = [...new Set(foundUrls)].filter(url => 
      !url.match(/\.(jpg|jpeg|png|gif|svg|xml|css|js)$/i)
    );

    console.log(`Found ${pageUrls.length} unique page URLs in sitemap.`);

    for (const url of pageUrls) {
      const pageText = await getTextFromUrl(url);
      if (pageText) {
        // Add a separator for clarity
        allText += `\n\n--- Page: ${url} ---\n\n`;
        allText += pageText;
      }
    }

    console.log("\n\n=== Combined Text Content ===\n");
    console.log(allText);

    // Write the combined text to a file
    const fs = await import('fs/promises');
    try {
      await fs.writeFile('scraped-content.txt', allText, 'utf8');
      console.log('\nContent has been saved to scraped-content.txt');
    } catch (writeError) {
      console.error(`Failed to write file: ${writeError.message}`);
    }

  } catch (error) {
    console.error(`Failed to process sitemap: ${error.message}`);
  }
}

processSitemap();
