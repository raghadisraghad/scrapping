const fs = require('fs');
const { chromium } = require('playwright');
const cheerio = require('cheerio');
require('dotenv').config();

let loadedPostCount = 0;
let savedPostCount = 0;

async function extractPosts(page) {
  const results = [];
  let postsLength = 0;

  try {
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      console.log(`___________________________________________Scrolling down ${i + 1} ...`);
      await page.waitForTimeout(10000);

      const newPosts = await page.$$('div[role="feed"] > div');
      if (newPosts.length > postsLength) {
        const newPostsSlice = newPosts.slice(postsLength);
        postsLength = newPosts.length;

        for (const element of newPostsSlice) {
          console.log('>>>>>>>> new post to extract');
          loadedPostCount++;

          try {
            await element.waitForSelector('h2', { state: 'visible' , timeout: 30000 });

            const seeMoreButton = await element.$('div[role="button"]:has-text("See more")');
            if (seeMoreButton) {
              await seeMoreButton.click();
              await page.waitForTimeout(3000);
            } else {
              console.log('Full content displayed!');
            }

            const postHtml = await element.innerHTML();
            const $ = cheerio.load(postHtml);
            const postAuthor = $('h2').text().trim();
            const postAuthorLink = $('h2 a').attr('href');
            const postContent = $('div[dir="auto"]').first().text().trim();
            const postDate = $('abbr').attr('title');
            const imgUrls = [];
            $('div[dir="auto"] + div img').each((index, imgElement) => {
              const imageUrl = $(imgElement).attr('src');
              imgUrls.push(imageUrl);
            });

            const comments = [];

            const viewMoreButton = await element.$('div[role="button"]:has-text("View more answers"), div[role="button"]:has-text("View more comments")');
            if (viewMoreButton) {
              await viewMoreButton.click();
              await page.waitForTimeout(3000);

              const popupHtml = await page.$eval('div[role="dialog"]', dialog => dialog.innerHTML);
              const popup$ = cheerio.load(popupHtml);

              popup$('div[role="article"]').each((j, comment) => {
                const commentAuthor = popup$(comment).find('span').eq(2).text().trim();
                const commentContent = popup$(comment).find('div[dir="auto"]').first().text().trim();
                const commentDate = popup$(comment).find('abbr').attr('title');
                comments.push({ author: commentAuthor, content: commentContent, date: commentDate });
              });
            } else {
              console.log('No more comments to load');
            }

            const closeBtn = await page.$('[aria-label="Close"]');
            if (closeBtn) {
              await closeBtn.click();
              await page.waitForTimeout(3000);
            } else {
              console.log('No pop-up to close');
            }

            if (postAuthor.length !== 0) {
              results.push({
                author: postAuthor,
                authorLink: `https://www.facebook.com${postAuthorLink}`,
                content: postContent,
                date: postDate,
                imgUrls,
                comments
              });
              savedPostCount++;
              console.log(`Saved post count: ${savedPostCount}`);
            } else {
                console.log('Post author not found:', element);
              }
          } catch (error) {
            console.error('Error extracting post:', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during scrolling and extracting posts:', error);
  }

  console.log(`Total posts loaded: ${loadedPostCount}`);
  console.log(`Total posts saved: ${savedPostCount}`);
  return results;
}

async function fetch() {
  let browser, page;

  try {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();

    await page.goto('https://www.facebook.com');
    await page.fill('#email', process.env.FACEBOOK_EMAIL);
    await page.fill('#pass', process.env.FACEBOOK_PASSWORD);
    await page.click('[name="login"]');
    await page.waitForNavigation();
    console.log('Connected!');
    await page.goto(`https://www.facebook.com/${process.env.GROUP_ID}`, { timeout: 60000 });
    console.log('Navigated to the group!');

    const posts = await extractPosts(page);
    fs.writeFileSync('./facebook/results.json', JSON.stringify(posts, null, 2));

    await page.waitForTimeout(3000);
  } catch (error) {
    console.error('Error during script execution:', error);
  } finally {
    if (page) {
      await page.close();
    }
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { fetch };
