import { getProvider } from '../services/tts/index.js';

export async function getVoices(req, res) {
  const { language } = req.query;
  const provider = getProvider();
  const allVoices = await provider.listVoices();
  const voices = language ? allVoices.filter((v) => v.language === language) : allVoices;
  res.status(200).json({ voices });
}
