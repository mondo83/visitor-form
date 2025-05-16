export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { record } = JSON.parse(event.body);

  const API_TOKEN = process.env.KINTONE_API_TOKEN;
  const APP_ID = process.env.KINTONE_APP_ID;
  const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;

  try {
    const response = await fetch(`https://${KINTONE_DOMAIN}/k/v1/record.json`, {
      method: "POST",
      headers: {
        "X-Cybozu-API-Token": API_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ app: APP_ID, record })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: data })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ id: data.id })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
