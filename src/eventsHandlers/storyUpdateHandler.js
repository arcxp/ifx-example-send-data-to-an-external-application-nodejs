const axios = require('axios')
const ARC_PERSONAL_ACCESS_TOKEN = process.env['mytoken']
const ARC_API_HOST = process.env['contentApiHost']
const WEBSITE_URL = process.env['WEBSITE_URL']

const storyUpdateHandler = (event) => {
  buildRequest(event);
}

/*
  First get the content elements. If content elements
    exist, build the request body to the 3rd party and
    wait for a response and log it.
  Further uses could be to update ANS with new data
    through Draft API.
*/
async function buildRequest(event) {

  try {
    const elements = await getContentElements(event);

    if (elements.length > 0) {
      // Hard-coded domain for example.
      const requestBody = {
        "title": event.body.headlines.basic,
        "external_id": event.body._id,
        "body": elements.join(''),
        "article_url": "https://www.something.com" + event.body.website_url,
        "publish_date": event.body.first_publish_date,
        "published": true
      }

      let result = await sendRequestToService(requestBody);
      console.log('result---->');
      console.log(result.data);
    }
    else {
      console.log('No body content existed in story ' + event.body._id);
    }
  } catch (err) {
    console.error('Error building request:', err);
  }
}

/*
  Send the request to the 3rd party and wait for a response
    then return that value to buildRequest()
*/
async function sendRequestToService(requestBody) {
  return await axios.post(WEBSITE_URL, requestBody, {
    headers: {
      Authorization: `Bearer thisIsJustPretend`
    }
  });
}

/*
  Build the Content API request URL
  Create a promise to retrieve the content elements
    and return that value to buildRequest()
*/
async function getContentElements(event) {
  const { body } = event;
  const website = body.website;
  const published = body.revision.published;
  const id = body._id;

  if (!website || !published || !id) {
    return [];
  }

  const contentApiUrl = `${ARC_API_HOST}/content/v4/stories?website=${website}&published=${published}&_id=${id}&included_fields=content_elements`;
  try {
    const contentElements = await fetchContentElements(contentApiUrl);
    console.log('contentElements......');
    console.log(contentElements);
    return contentElements;
  } catch (error) {
    console.error('Error fetching content elements:', error);
    return [];
  }
}

/*
  Send the request to Content API to retrieve the content elements
    for each of the text elements, format them into HTML <p> tags
    and add them to an array. Then return that value to getContentElements()
*/
async function fetchContentElements(contentApiUrl) {

  const response = await axios.get(contentApiUrl, {
    headers: {
      Authorization: `Bearer ${ARC_PERSONAL_ACCESS_TOKEN}`
    }
  })

  const contentElements = []
  for (const obj of Object.entries(response)) {
    for (const child of obj) {
      if (typeof (child) == "object" && child['content_elements'] !== undefined) {
        for (const element of child['content_elements']) {
          if (element.type == "text") {
            contentElements.push('<p>' + element.content + '</p>');
          }
        }
      }
    }
  }
  return contentElements;
}


module.exports = storyUpdateHandler;