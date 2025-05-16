// netlify/functions/sendtokintone.js

export async function handler(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Function is alive!" })
  };
}
