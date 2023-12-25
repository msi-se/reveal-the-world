
export const memoFetchAndDecode = async (url) => {

  const prefix = "memoFetchAndDecode_";

  const alreadyFetched = localStorage.getItem(prefix + url);
  if (alreadyFetched) {
    return JSON.parse(alreadyFetched);
  }

  const response = await fetch(url)
  const data = await response.json();

  const saveToLocalStorage = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // remove the oldest entry and try again
      const keys = Object.keys(localStorage);
      localStorage.removeItem(keys[0]);
      saveToLocalStorage(key, data);
    }
  }

  saveToLocalStorage(prefix + url, data);

  return data;
}