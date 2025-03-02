// politicalState.js
export async function setLeaningValue(value) {
  await chrome.storage.local.set({ politicalLeaning: value });
}

export async function getLeaningValue() {
  const data = await chrome.storage.local.get("politicalLeaning");
  return data.politicalLeaning || null;
}