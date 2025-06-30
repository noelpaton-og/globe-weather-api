import axios from "axios";

export default async function handler(req, res) {
  const { city } = req.query;

  if (!city) return res.status(400).json({ error: "City is required." });

  try {
    const result = await axios.post(
      `${process.env.BACK4APP_URL}/weather`,
      { city },
      {
        headers: {
          "X-Parse-Application-Id": process.env.BACK4APP_APP_ID,
          "X-Parse-REST-API-Key": process.env.BACK4APP_REST_KEY,
          "x-api-key": process.env.BACK4APP_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(result.data.result);
  } catch (err) {
    res.status(500).json({ error: err?.response?.data?.error || err.message });
  }
}
